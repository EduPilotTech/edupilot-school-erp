import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, WebhookEvent as PrismaWebhookEvent } from "@/lib/generated/prisma/client";
import type { CreateWebhookEventInput, MarkWebhookEventProcessedInput, WebhookEventRepository } from "../domain/webhook-event.repository";
import type { PaymentGatewayProviderCodeValue } from "../domain/payment.entity";
import type { WebhookEventEntity, WebhookEventStatusValue } from "../domain/webhook-event.entity";

// Platform-ops tier — direct `prisma` client, no tenantId. Plain insert only; the idempotency
// "check first, then create, tolerate the redelivery race" dance belongs to
// webhook-event.service.ts (see the domain repository's own comment).
export function toEntity(row: PrismaWebhookEvent): WebhookEventEntity {
  return {
    id: row.id,
    gatewayProvider: row.gatewayProvider as PaymentGatewayProviderCodeValue,
    eventType: row.eventType,
    gatewayEventId: row.gatewayEventId,
    payloadSnapshot: row.payloadSnapshot,
    signatureVerified: row.signatureVerified,
    status: row.status as WebhookEventStatusValue,
    relatedPaymentId: row.relatedPaymentId,
    processingError: row.processingError,
    receivedAt: row.receivedAt,
    processedAt: row.processedAt,
  };
}

export class PrismaWebhookEventRepository implements WebhookEventRepository {
  async findByProviderAndEventId(
    gatewayProvider: PaymentGatewayProviderCodeValue,
    gatewayEventId: string
  ): Promise<WebhookEventEntity | null> {
    const row = await prisma.webhookEvent.findUnique({
      where: { gatewayProvider_gatewayEventId: { gatewayProvider, gatewayEventId } },
    });
    return row ? toEntity(row) : null;
  }

  async create(input: CreateWebhookEventInput): Promise<WebhookEventEntity> {
    const row = await prisma.webhookEvent.create({
      data: {
        gatewayProvider: input.gatewayProvider,
        eventType: input.eventType,
        gatewayEventId: input.gatewayEventId,
        payloadSnapshot: input.payloadSnapshot as Prisma.InputJsonValue,
        signatureVerified: input.signatureVerified,
        status: input.status,
      },
    });
    return toEntity(row);
  }

  // Bundle B, Step 0 — additive. Sets `processedAt` unconditionally (the moment this method is
  // called IS the moment processing concluded, one way or the other); `relatedPaymentId`/
  // `processingError` are passed straight through to Prisma's update `data` (undefined means
  // "leave the column unchanged", matching every other optional-field update in this module —
  // see PrismaPaymentRepository.updateStatus's own identical discipline).
  async markProcessingResult(id: string, input: MarkWebhookEventProcessedInput): Promise<WebhookEventEntity> {
    const row = await prisma.webhookEvent.update({
      where: { id },
      data: {
        status: input.status,
        relatedPaymentId: input.relatedPaymentId,
        processingError: input.processingError,
        processedAt: new Date(),
      },
    });
    return toEntity(row);
  }
}
