import { z } from "zod";
import type { FeePaymentModeValue, FeePaymentStatusValue } from "../../domain/fee-payment.entity";

const paymentModeEnum = z.enum(["CASH", "CHEQUE", "UPI", "CARD", "BANK_TRANSFER", "ONLINE"]);

export const collectPaymentSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  clientRequestId: z.string().uuid("A client request id is required to prevent duplicate submission."),
  paymentMode: paymentModeEnum,
  remarks: z.string().trim().max(500).optional(),
  allocations: z
    .array(
      z.object({
        invoiceId: z.string().uuid("Invalid invoice id."),
        amount: z.number().positive("Allocated amount must be greater than zero."),
      })
    )
    .min(1, "At least one invoice must be selected for payment."),
});
export type CollectPaymentServiceInput = z.infer<typeof collectPaymentSchema>;

export const reversePaymentSchema = z.object({
  paymentId: z.string().uuid("Payment is required."),
  reason: z.string().trim().min(1, "A reversal reason is required.").max(500),
});
export type ReversePaymentServiceInput = z.infer<typeof reversePaymentSchema>;

export interface FeePaymentAllocationDTO {
  invoiceId: string;
  amountAllocated: number;
}

export interface FeePaymentDTO {
  id: string;
  studentId: string;
  academicSessionId: string;
  receiptNumber: string;
  amount: number;
  paymentMode: FeePaymentModeValue;
  status: FeePaymentStatusValue;
  paidAt: string;
  collectedBy: string | null;
  remarks: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
  allocations: FeePaymentAllocationDTO[];
}
