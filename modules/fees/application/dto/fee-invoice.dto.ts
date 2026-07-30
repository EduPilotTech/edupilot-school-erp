import { z } from "zod";
import type { FeeInvoiceStatusValue } from "../../domain/fee-invoice.entity";

export const generateMonthlyInvoicesSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  billingPeriod: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing period must be in YYYY-MM format."),
});
export type GenerateMonthlyInvoicesServiceInput = z.infer<typeof generateMonthlyInvoicesSchema>;

export const generateOneTimeInvoiceSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  feeStructureItemId: z.string().uuid("Fee structure item is required."),
});
export type GenerateOneTimeInvoiceServiceInput = z.infer<typeof generateOneTimeInvoiceSchema>;

export const generateInstallmentInvoicesSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  feeStructureItemId: z.string().uuid("Fee structure item is required."),
});
export type GenerateInstallmentInvoicesServiceInput = z.infer<typeof generateInstallmentInvoicesSchema>;

export const cancelInvoiceSchema = z.object({
  invoiceId: z.string().uuid("Invoice is required."),
  reason: z.string().trim().min(1, "A cancellation reason is required.").max(500),
});
export type CancelInvoiceServiceInput = z.infer<typeof cancelInvoiceSchema>;

export interface FeeInvoiceDTO {
  id: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  feeCategoryId: string;
  feeStructureItemId: string | null;
  routeFeeRuleId: string | null;
  hostelFeeRuleId: string | null;
  installmentPlanId: string | null;
  installmentNumber: number | null;
  appliedConcessionId: string | null;
  invoiceNumber: string;
  billingPeriod: string;
  amount: number;
  discountAmount: number;
  fineAmount: number;
  amountPaid: number;
  taxAmount: number | null;
  balance: number;
  dueDate: string;
  status: FeeInvoiceStatusValue;
  cancelledAt: string | null;
  cancellationReason: string | null;
}
