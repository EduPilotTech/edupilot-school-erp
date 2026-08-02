import { z } from "zod";
import type { PaymentGatewayProviderCodeValue, PaymentStatusValue } from "../../domain/payment.entity";

const gatewayProviderEnum = z.enum(["RAZORPAY", "PHONEPE"]);

export const initiatePaymentSchema = z.object({
  subscriptionInvoiceId: z.string().uuid("Invoice is required."),
  gatewayProvider: gatewayProviderEnum,
  gatewayOrderId: z.string().trim().min(1, "Gateway order id is required."),
  amount: z.number().positive("Amount must be greater than zero."),
  currency: z.string().trim().length(3, "Currency must be a 3-letter ISO code."),
  method: z.string().trim().max(50).optional(),
});
export type InitiatePaymentServiceInput = z.infer<typeof initiatePaymentSchema>;

export const markPaymentCapturedSchema = z.object({
  gatewayPaymentId: z.string().trim().min(1, "Gateway payment id is required."),
  gatewayResponseSnapshot: z.unknown().optional(),
});
export type MarkPaymentCapturedServiceInput = z.infer<typeof markPaymentCapturedSchema>;

export const markPaymentFailedSchema = z.object({
  failureReason: z.string().trim().min(1, "A failure reason is required.").max(500),
  gatewayResponseSnapshot: z.unknown().optional(),
});
export type MarkPaymentFailedServiceInput = z.infer<typeof markPaymentFailedSchema>;

export const refundPaymentSchema = z.object({
  refundAmount: z.number().positive("Refund amount must be greater than zero."),
});
export type RefundPaymentServiceInput = z.infer<typeof refundPaymentSchema>;

export interface PaymentDTO {
  id: string;
  tenantId: string;
  subscriptionInvoiceId: string;
  gatewayProvider: PaymentGatewayProviderCodeValue;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatusValue;
  method: string | null;
  failureReason: string | null;
  refundedAmount: number;
  capturedAt: string | null;
  refundedAt: string | null;
}
