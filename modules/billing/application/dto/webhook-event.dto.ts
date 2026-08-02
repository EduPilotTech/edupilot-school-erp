import { z } from "zod";
import type { PaymentGatewayProviderCodeValue } from "../../domain/payment.entity";
import type { WebhookEventStatusValue } from "../../domain/webhook-event.entity";

const gatewayProviderEnum = z.enum(["RAZORPAY", "PHONEPE"]);

export const recordWebhookEventSchema = z.object({
  gatewayProvider: gatewayProviderEnum,
  eventType: z.string().trim().min(1, "Event type is required.").max(100),
  gatewayEventId: z.string().trim().min(1, "Gateway event id is required."),
  payloadSnapshot: z.unknown(),
  signatureVerified: z.boolean(),
});
export type RecordWebhookEventServiceInput = z.infer<typeof recordWebhookEventSchema>;

export interface WebhookEventDTO {
  id: string;
  gatewayProvider: PaymentGatewayProviderCodeValue;
  eventType: string;
  gatewayEventId: string;
  signatureVerified: boolean;
  status: WebhookEventStatusValue;
  processingError: string | null;
  receivedAt: string;
}
