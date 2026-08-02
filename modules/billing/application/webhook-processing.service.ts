import "server-only";
import { ValidationError } from "@/lib/errors";
import { WebhookSignatureInvalidError } from "../domain/errors";
import {
  deriveWebhookIdempotencyKey,
  isWebhookTimestampFresh,
  verifyWebhookSignature,
} from "../infrastructure/payment-gateway/webhook-signature.helpers";
import { getRazorpayWebhookSecret } from "../infrastructure/payment-gateway/razorpay-env";
import { PrismaWebhookEventRepository } from "../infrastructure/prisma-webhook-event.repository";
import { getWebhookEvent, recordWebhookEvent } from "./webhook-event.service";
import { processPaymentWebhookEvent } from "./payment-processing.service";
import { processRefundWebhookEvent } from "./refund-processing.service";
import type { WebhookEventDTO } from "./dto/webhook-event.dto";
import type { PlatformBillingContext } from "./billing-context";

// Bundle B, Step 2 — the main ingestion entry point. What a future (not built in this bundle)
// route handler calling `req.text()` (never `req.json()` — signing is computed over the exact raw
// bytes, see webhook-signature.helpers.ts) would hand off to.
export interface IngestWebhookInput {
  rawBody: string;
  signatureHeader: string;
  headerEventId: string | null;
}

const webhookEventRepository = new PrismaWebhookEventRepository();

interface RazorpayWebhookEnvelope {
  event: string;
  createdAtUnixSeconds: number;
}

// Parses `rawBody` and validates Razorpay's own top-level envelope shape:
// {entity: "event", event: "payment.captured", payload: {...}, created_at: 1234567890}. Throws
// ValidationError (never an unhandled crash) for malformed JSON or a missing/wrong-typed
// `event`/`created_at` — reachable even after a valid signature (the signature only proves who
// sent the bytes, not that the bytes are well-formed).
function parseWebhookEnvelope(rawBody: string): { parsedBody: Record<string, unknown>; envelope: RazorpayWebhookEnvelope } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new ValidationError("Malformed webhook body: not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new ValidationError("Malformed webhook body: expected a JSON object.");
  }

  const parsedBody = parsed as Record<string, unknown>;
  if (typeof parsedBody.event !== "string" || parsedBody.event.length === 0) {
    throw new ValidationError("Malformed webhook body: missing or invalid 'event'.");
  }
  if (typeof parsedBody.created_at !== "number") {
    throw new ValidationError("Malformed webhook body: missing or invalid 'created_at'.");
  }

  return { parsedBody, envelope: { event: parsedBody.event, createdAtUnixSeconds: parsedBody.created_at } };
}

// Dispatches an already-RECEIVED (trusted, not-yet-processed) event to the type-specific
// processor and reports the outcome back onto the WebhookEvent row. Any error thrown by a
// processor is caught here — never allowed to propagate out of `ingestRazorpayWebhook` — because
// the eventual route handler calling this must still be able to return a clean HTTP response to
// Razorpay even when internal processing fails. Razorpay retries on a non-2xx response, which is
// fine/expected; an uncaught exception crashing the whole request is a different, unacceptable
// failure mode.
async function dispatch(webhookEventId: string, eventType: string, payload: unknown): Promise<void> {
  try {
    if (eventType.startsWith("payment.") || eventType.startsWith("subscription.")) {
      await processPaymentWebhookEvent({ webhookEventId, eventType, payload });
    } else if (eventType.startsWith("refund.")) {
      await processRefundWebhookEvent({ webhookEventId, eventType, payload });
    } else {
      // A recognized envelope but a family this codebase has no processor for at all (e.g. an
      // `order.*` event) — acknowledged, not an error.
      await webhookEventRepository.markProcessingResult(webhookEventId, { status: "PROCESSED" });
    }
  } catch (error) {
    await webhookEventRepository.markProcessingResult(webhookEventId, {
      status: "FAILED",
      processingError: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function ingestRazorpayWebhook(input: IngestWebhookInput, context: PlatformBillingContext): Promise<WebhookEventDTO> {
  // Hard rule per the approved Architecture Review: reject before touching Prisma on ANY
  // verification failure. Nothing is written to the database for a request whose signature does
  // not check out — not even an IGNORED WebhookEvent row.
  const signatureValid = verifyWebhookSignature(input.rawBody, input.signatureHeader, getRazorpayWebhookSecret());
  if (!signatureValid) {
    throw new WebhookSignatureInvalidError();
  }

  const { parsedBody, envelope } = parseWebhookEnvelope(input.rawBody);

  // Two INDEPENDENT gates, not one: the cryptographic signature just checked out above, but a
  // stale timestamp is treated as equally untrustworthy for processing purposes even though the
  // signature itself was valid — see isWebhookTimestampFresh's own doc comment for why this is a
  // heuristic, not a guarantee, and why DB-level idempotency remains the real safety net. Either
  // gate failing routes the event to IGNORED (via recordWebhookEvent's own
  // signatureVerified-driven status logic), not just the first one.
  const timestampFresh = isWebhookTimestampFresh(envelope.createdAtUnixSeconds, new Date());
  const trustedForProcessing = signatureValid && timestampFresh;

  const gatewayEventId = deriveWebhookIdempotencyKey("RAZORPAY", input.headerEventId, envelope.event, parsedBody);

  const event = await recordWebhookEvent(
    {
      gatewayProvider: "RAZORPAY",
      eventType: envelope.event,
      gatewayEventId,
      payloadSnapshot: parsedBody,
      signatureVerified: trustedForProcessing,
    },
    context
  );

  // REPLAY-PROTECTION payoff: `status !== "RECEIVED"` covers a stale-timestamp event just
  // recorded as IGNORED above, AND a redelivery of an event already resolved
  // (PROCESSED/FAILED) or already IGNORED by an earlier delivery — either way, dispatch never
  // runs twice for the same gatewayEventId.
  if (event.status !== "RECEIVED") {
    return event;
  }

  await dispatch(event.id, envelope.event, parsedBody);

  const finalState = await getWebhookEvent("RAZORPAY", gatewayEventId);
  return finalState ?? event;
}
