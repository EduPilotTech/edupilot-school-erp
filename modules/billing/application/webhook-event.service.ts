import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaWebhookEventRepository } from "../infrastructure/prisma-webhook-event.repository";
import { recordPlatformAudit } from "./billing-audit.helpers";
import { recordWebhookEventSchema, type WebhookEventDTO } from "./dto/webhook-event.dto";
import type { WebhookEventEntity } from "../domain/webhook-event.entity";
import type { PaymentGatewayProviderCodeValue } from "../domain/payment.entity";
import type { PlatformBillingContext } from "./billing-context";

function toDTO(entity: WebhookEventEntity): WebhookEventDTO {
  return {
    id: entity.id,
    gatewayProvider: entity.gatewayProvider,
    eventType: entity.eventType,
    gatewayEventId: entity.gatewayEventId,
    signatureVerified: entity.signatureVerified,
    status: entity.status,
    processingError: entity.processingError,
    receivedAt: entity.receivedAt.toISOString(),
  };
}

const webhookEventRepository = new PrismaWebhookEventRepository();

// Platform-ops ingestion — records the raw inbound gateway event, distinct from what our own
// system later does with it (see WebhookEventEntity's own comment). Signature verification itself
// is NOT this service's concern: `signatureVerified` arrives already computed by the caller (an
// infra webhook route handler using the gateway's own SDK/HMAC check) — this service only decides
// what to do with that already-known verdict. An unverified signature is still recorded (for
// security/audit visibility into rejected delivery attempts), immediately as IGNORED rather than
// RECEIVED, so nothing downstream ever picks it up for processing.
//
// Idempotency on (gatewayProvider, gatewayEventId) is DB-enforced (see the schema's own unique
// constraint) — webhooks can be redelivered by the gateway, so "check first, then create, and on
// the redelivery race just return the row that won" is the dance this function performs, per the
// domain repository's own comment.
export async function recordWebhookEvent(input: unknown, context: PlatformBillingContext): Promise<WebhookEventDTO> {
  const parsed = recordWebhookEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid webhook event data.");
  }
  const data = parsed.data;
  const { actingUserId } = context;

  const existing = await webhookEventRepository.findByProviderAndEventId(data.gatewayProvider, data.gatewayEventId);
  if (existing) {
    return toDTO(existing);
  }

  try {
    const event = await webhookEventRepository.create({
      gatewayProvider: data.gatewayProvider,
      eventType: data.eventType,
      gatewayEventId: data.gatewayEventId,
      payloadSnapshot: data.payloadSnapshot,
      signatureVerified: data.signatureVerified,
      status: data.signatureVerified ? "RECEIVED" : "IGNORED",
    });

    await recordPlatformAudit({
      actorId: actingUserId,
      action: "WEBHOOK_EVENT_RECORDED",
      entityType: "WebhookEvent",
      entityId: event.id,
      afterState: event,
    });

    return toDTO(event);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const redelivered = await webhookEventRepository.findByProviderAndEventId(data.gatewayProvider, data.gatewayEventId);
      if (redelivered) return toDTO(redelivered);
    }
    throw error;
  }
}

export async function getWebhookEvent(
  gatewayProvider: PaymentGatewayProviderCodeValue,
  gatewayEventId: string
): Promise<WebhookEventDTO | null> {
  const event = await webhookEventRepository.findByProviderAndEventId(gatewayProvider, gatewayEventId);
  return event ? toDTO(event) : null;
}

export { toDTO as toWebhookEventDTO };
