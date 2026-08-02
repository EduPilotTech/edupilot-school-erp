import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaPaymentRepository } from "../infrastructure/prisma-payment.repository";
import { PrismaWebhookEventRepository } from "../infrastructure/prisma-webhook-event.repository";
import { PrismaSubscriptionRepository } from "../infrastructure/prisma-subscription.repository";
import { getPayment, markPaymentCaptured, markPaymentFailed } from "./payment.service";
import { createSubscription } from "./subscription.service";
import { SubscriptionNotFoundError } from "../domain/errors";

// Bundle B, Step 3 — dispatched from webhook-processing.service.ts for every `payment.*` and
// `subscription.*` event of an already-RECEIVED (trusted, not-yet-processed) WebhookEvent. Takes
// exactly what it needs rather than a full WebhookEventDTO (which doesn't carry `payloadSnapshot`
// — see dto/webhook-event.dto.ts) plus the already-parsed payload the caller has in hand anyway.
export interface ProcessPaymentWebhookEventInput {
  webhookEventId: string;
  eventType: string;
  payload: unknown;
}

// Fixed system-actor marker for mutations triggered by an inbound gateway webhook rather than a
// human/session-initiated request — no real UserProfile row backs this string; it exists purely
// so PlatformAuditLog/Payment `updatedBy` rows for webhook-driven mutations are self-explanatory
// at a glance, rather than a bare null (which BillingContext.actingUserId, unlike
// PlatformBillingContext's, does not even permit).
const WEBHOOK_SYSTEM_ACTOR = "system:razorpay-webhook";

const paymentRepository = new PrismaPaymentRepository();
const webhookEventRepository = new PrismaWebhookEventRepository();
const subscriptionRepository = new PrismaSubscriptionRepository();

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  method: string | null;
  errorDescription: string | null;
  // The raw, unshaped {id, order_id, amount, currency, status, method, ...} object as Razorpay
  // sent it — preserved separately from the narrowed fields above so
  // markPaymentCaptured/markPaymentFailed's own `gatewayResponseSnapshot` keeps every field
  // Razorpay reported, not just the ones this handler happens to read.
  raw: Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

// Defensive, field-by-field extraction of Razorpay's actual nesting for a payment.* webhook:
// {payload: {payment: {entity: {id, order_id, amount, currency, status, method, ...}}}}. Throws
// ValidationError (never crashes on `undefined.foo`) the moment an expected field is missing or
// the wrong type — a malformed payload reaching here (despite a valid signature) must fail loud
// and be caught by webhook-processing.service.ts's own try/catch, not crash the request.
function extractPaymentEntity(payload: unknown): RazorpayPaymentEntity {
  const root = asRecord(payload);
  const payloadField = root ? asRecord(root.payload) : null;
  const paymentWrapper = payloadField ? asRecord(payloadField.payment) : null;
  const entity = paymentWrapper ? asRecord(paymentWrapper.entity) : null;

  if (
    !entity ||
    typeof entity.id !== "string" ||
    typeof entity.order_id !== "string" ||
    typeof entity.amount !== "number" ||
    typeof entity.currency !== "string" ||
    typeof entity.status !== "string"
  ) {
    throw new ValidationError(
      "Malformed webhook payload: 'payload.payment.entity' is missing one of the required fields (id, order_id, amount, currency, status)."
    );
  }

  return {
    id: entity.id,
    order_id: entity.order_id,
    method: typeof entity.method === "string" ? entity.method : null,
    errorDescription: typeof entity.error_description === "string" ? entity.error_description : null,
    raw: entity,
  };
}

interface SubscriptionChargedNotes {
  tenantId: string;
  subscriptionId: string;
}

// Judgment call (documented per the task brief): this billing module generates its own invoices
// via BillingRun/generateSubscriptionInvoice rather than relying on Razorpay's native
// Subscriptions product, so `subscription.charged` is interpreted pragmatically as "a recurring
// charge succeeded for the subscription named in the order's own `notes`" — the same `notes`
// createRazorpayOrder attaches to every order it creates (see razorpay.service.ts). Razorpay's
// own Subscriptions API specifics were not chosen in the Architecture Review, so this is the
// deliberately narrow interpretation that lets renewal reuse createSubscription's own
// already-frozen close-then-create logic with zero new Subscription-repository code.
function extractSubscriptionChargedNotes(payload: unknown): SubscriptionChargedNotes {
  const root = asRecord(payload);
  const payloadField = root ? asRecord(root.payload) : null;
  const paymentWrapper = payloadField ? asRecord(payloadField.payment) : null;
  const entity = paymentWrapper ? asRecord(paymentWrapper.entity) : null;
  const notes = entity ? asRecord(entity.notes) : null;

  if (!notes || typeof notes.tenantId !== "string" || typeof notes.subscriptionId !== "string") {
    throw new ValidationError(
      "Malformed webhook payload: 'payload.payment.entity.notes.tenantId'/'subscriptionId' are required to process a subscription renewal."
    );
  }

  return { tenantId: notes.tenantId, subscriptionId: notes.subscriptionId };
}

async function handlePaymentCaptured(webhookEventId: string, payload: unknown): Promise<void> {
  const entity = extractPaymentEntity(payload);

  const resolved = await paymentRepository.findByGatewayOrderIdAnyTenant("RAZORPAY", entity.order_id);
  if (!resolved) {
    throw new ValidationError(`No Payment found for Razorpay order '${entity.order_id}'.`);
  }

  // Payment-level idempotency (distinct from the WebhookEvent-level dedupe already performed by
  // the caller): re-read the payment fresh, since the whole point is to catch the state as it
  // stands right now, not the snapshot from the lookup above. Already-CAPTURED is a no-op, not an
  // InvalidPaymentTransitionError.
  const current = await getPayment(resolved.tenantId, resolved.id);
  if (current.status !== "CAPTURED") {
    await markPaymentCaptured(
      resolved.id,
      { gatewayPaymentId: entity.id, gatewayResponseSnapshot: entity.raw },
      { tenantId: resolved.tenantId, actingUserId: WEBHOOK_SYSTEM_ACTOR }
    );
  }

  await webhookEventRepository.markProcessingResult(webhookEventId, { status: "PROCESSED", relatedPaymentId: resolved.id });
}

async function handlePaymentFailed(webhookEventId: string, payload: unknown): Promise<void> {
  const entity = extractPaymentEntity(payload);

  const resolved = await paymentRepository.findByGatewayOrderIdAnyTenant("RAZORPAY", entity.order_id);
  if (!resolved) {
    throw new ValidationError(`No Payment found for Razorpay order '${entity.order_id}'.`);
  }

  const current = await getPayment(resolved.tenantId, resolved.id);
  if (current.status !== "FAILED") {
    await markPaymentFailed(
      resolved.id,
      { failureReason: entity.errorDescription ?? "Payment failed", gatewayResponseSnapshot: entity.raw },
      { tenantId: resolved.tenantId, actingUserId: WEBHOOK_SYSTEM_ACTOR }
    );
  }

  await webhookEventRepository.markProcessingResult(webhookEventId, { status: "PROCESSED", relatedPaymentId: resolved.id });
}

async function handleSubscriptionCharged(webhookEventId: string, payload: unknown): Promise<void> {
  const { tenantId, subscriptionId } = extractSubscriptionChargedNotes(payload);

  const subscription = await subscriptionRepository.findById(tenantId, subscriptionId);
  if (!subscription) {
    throw new SubscriptionNotFoundError();
  }

  // Reuses the already-frozen close-then-create revision logic directly: `effectiveFrom` is the
  // just-ended period's own `currentPeriodEnd`, so the new row starts exactly where the old one
  // stopped — zero-gap renewal, no new Subscription-repository code required.
  await createSubscription(
    {
      subscriptionPlanDefinitionId: subscription.subscriptionPlanDefinitionId,
      billingCycle: subscription.billingCycle,
      effectiveFrom: subscription.currentPeriodEnd,
      autoRenew: subscription.autoRenew,
    },
    { tenantId, actingUserId: WEBHOOK_SYSTEM_ACTOR }
  );

  // No `relatedPaymentId` — a `subscription.charged` event is about the Subscription revision it
  // triggers, not about one Payment row (this module never creates a Payment row for it).
  await webhookEventRepository.markProcessingResult(webhookEventId, { status: "PROCESSED" });
}

export async function processPaymentWebhookEvent(input: ProcessPaymentWebhookEventInput): Promise<void> {
  const { webhookEventId, eventType, payload } = input;

  switch (eventType) {
    case "payment.captured":
      await handlePaymentCaptured(webhookEventId, payload);
      return;
    case "payment.failed":
      await handlePaymentFailed(webhookEventId, payload);
      return;
    case "subscription.charged":
      await handleSubscriptionCharged(webhookEventId, payload);
      return;
    default:
      // An unrecognized *sub-type* within the payment.*/subscription.* family this function owns
      // is not a processing error — just nothing more to do. Acknowledged, not FAILED.
      await webhookEventRepository.markProcessingResult(webhookEventId, { status: "PROCESSED" });
  }
}
