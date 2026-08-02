import type { PaymentGatewayProviderCodeValue } from "./payment.entity";
import type { WebhookEventEntity, WebhookEventStatusValue } from "./webhook-event.entity";

export interface CreateWebhookEventInput {
  gatewayProvider: PaymentGatewayProviderCodeValue;
  eventType: string;
  gatewayEventId: string;
  payloadSnapshot: unknown;
  signatureVerified: boolean;
  status: WebhookEventStatusValue;
}

// Bundle B, Step 0 — additive. Bundle A's own scope explicitly deferred all processing logic
// (see WebhookEventEntity.relatedPaymentId's own comment: "This bundle never sets it"), so there
// was never a way to record the OUTCOME of processing an event. `status` is intentionally narrower
// than the full WebhookEventStatusValue union — a processor only ever resolves an event to
// PROCESSED or FAILED; RECEIVED/VERIFIED/IGNORED are states this method never transitions *into*.
export interface MarkWebhookEventProcessedInput {
  status: "PROCESSED" | "FAILED";
  relatedPaymentId?: string | null;
  processingError?: string | null;
}

// Platform-ops tier — no tenantId on any method (see the module-level brief). `create` is a plain
// insert; the caller (webhook-event.service.ts) is responsible for the "check first, then create,
// tolerate the unique-constraint redelivery race" idempotency dance described in its own comment
// — this repository intentionally exposes no upsert, since "create a webhook event" and "recognize
// a redelivery" are different concerns the service composes, not something to hide in the
// repository.
export interface WebhookEventRepository {
  findByProviderAndEventId(gatewayProvider: PaymentGatewayProviderCodeValue, gatewayEventId: string): Promise<WebhookEventEntity | null>;
  create(input: CreateWebhookEventInput): Promise<WebhookEventEntity>;

  // Bundle B, Step 0 — additive, purely new: records the terminal outcome of processing an
  // already-RECEIVED event (sets `processedAt`, and `relatedPaymentId`/`processingError` when
  // given). Does not change the meaning or behavior of `findByProviderAndEventId`/`create`.
  markProcessingResult(id: string, input: MarkWebhookEventProcessedInput): Promise<WebhookEventEntity>;
}
