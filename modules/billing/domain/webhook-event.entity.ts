import type { PaymentGatewayProviderCodeValue } from "./payment.entity";

export type WebhookEventStatusValue = "RECEIVED" | "VERIFIED" | "PROCESSED" | "FAILED" | "IGNORED";

// Platform-ops — no tenantId (a raw inbound gateway event is not about one tenant). Raw inbound
// gateway event log, distinct from PlatformAuditLog: this records what the gateway told us
// (including events ultimately rejected/ignored), not what our own system did. Idempotency via
// [gatewayProvider, gatewayEventId] — webhooks can be redelivered.
export interface WebhookEventEntity {
  id: string;
  gatewayProvider: PaymentGatewayProviderCodeValue;
  eventType: string;
  gatewayEventId: string;
  payloadSnapshot: unknown;
  signatureVerified: boolean;
  status: WebhookEventStatusValue;
  // Nullable — set once the event has been resolved to a specific Payment during processing.
  // This bundle never sets it (see webhook-event.service.ts's own scope note) — future work.
  relatedPaymentId: string | null;
  processingError: string | null;
  receivedAt: Date;
  processedAt: Date | null;
}
