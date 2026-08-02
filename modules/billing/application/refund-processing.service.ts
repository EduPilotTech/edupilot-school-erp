import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaPaymentRepository } from "../infrastructure/prisma-payment.repository";
import { PrismaWebhookEventRepository } from "../infrastructure/prisma-webhook-event.repository";
import { getPayment, refundPayment } from "./payment.service";

// Bundle B, Step 4 — dispatched from webhook-processing.service.ts for every `refund.*` event of
// an already-RECEIVED WebhookEvent. Same narrow-input shape as
// payment-processing.service.ts's ProcessPaymentWebhookEventInput, for the same reason
// (WebhookEventDTO doesn't carry payloadSnapshot — see dto/webhook-event.dto.ts).
export interface ProcessRefundWebhookEventInput {
  webhookEventId: string;
  eventType: string;
  payload: unknown;
}

// Same fixed system-actor marker as payment-processing.service.ts — see that file's own comment.
const WEBHOOK_SYSTEM_ACTOR = "system:razorpay-webhook";

const paymentRepository = new PrismaPaymentRepository();
const webhookEventRepository = new PrismaWebhookEventRepository();

interface RazorpayRefundEntity {
  id: string;
  paymentId: string;
  amountRupees: number;
  raw: Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

// Defensive extraction of Razorpay's actual nesting for a refund webhook:
// {payload: {refund: {entity: {id, payment_id, amount, status}}}}. A refund webhook always
// references the payment by `payment_id`, not by the order id `payment.*` events use — so
// resolution below goes through `findByGatewayPaymentIdAnyTenant`, not
// `findByGatewayOrderIdAnyTenant`; Razorpay does also include a sibling `payload.payment.entity`
// in the same webhook, but nothing here needs it, since `refund.entity.payment_id` alone is
// sufficient to resolve the tenant-agnostic Payment row.
function extractRefundEntity(payload: unknown): RazorpayRefundEntity {
  const root = asRecord(payload);
  const payloadField = root ? asRecord(root.payload) : null;
  const refundWrapper = payloadField ? asRecord(payloadField.refund) : null;
  const entity = refundWrapper ? asRecord(refundWrapper.entity) : null;

  if (!entity || typeof entity.id !== "string" || typeof entity.payment_id !== "string" || typeof entity.amount !== "number") {
    throw new ValidationError(
      "Malformed webhook payload: 'payload.refund.entity' is missing one of the required fields (id, payment_id, amount)."
    );
  }

  return {
    id: entity.id,
    paymentId: entity.payment_id,
    // Gateway amounts are paise; every rupee-denominated field on our own Payment entity
    // (amount, refundedAmount) is in rupees — convert once, at this call site.
    amountRupees: Math.round(entity.amount) / 100,
    raw: entity,
  };
}

async function handleRefundRecorded(webhookEventId: string, payload: unknown): Promise<void> {
  const entity = extractRefundEntity(payload);

  const resolved = await paymentRepository.findByGatewayPaymentIdAnyTenant("RAZORPAY", entity.paymentId);
  if (!resolved) {
    throw new ValidationError(`No Payment found for Razorpay payment '${entity.paymentId}'.`);
  }

  // Idempotency: if this Payment's own `refundedAmount` already accounts for at least this
  // refund's amount (a redelivery of a refund already applied, or a smaller/equal refund already
  // recorded via a different path), treat it as a no-op rather than calling refundPayment again
  // — refundPayment always ADDS to the running total, so replaying it here would double-count.
  const current = await getPayment(resolved.tenantId, resolved.id);
  if (current.refundedAmount < entity.amountRupees) {
    await refundPayment(
      resolved.id,
      { refundAmount: entity.amountRupees },
      { tenantId: resolved.tenantId, actingUserId: WEBHOOK_SYSTEM_ACTOR }
    );
  }

  await webhookEventRepository.markProcessingResult(webhookEventId, { status: "PROCESSED", relatedPaymentId: resolved.id });
}

export async function processRefundWebhookEvent(input: ProcessRefundWebhookEventInput): Promise<void> {
  const { webhookEventId, eventType } = input;

  // "refund.processed" and "refund.created" both indicate a refund the gateway has recorded —
  // handled identically. Any other `refund.*` sub-type is acknowledged but inert, mirroring
  // payment-processing.service.ts's own "unrecognized sub-type within a family we own" handling.
  if (eventType === "refund.processed" || eventType === "refund.created") {
    await handleRefundRecorded(webhookEventId, input.payload);
    return;
  }

  await webhookEventRepository.markProcessingResult(webhookEventId, { status: "PROCESSED" });
}
