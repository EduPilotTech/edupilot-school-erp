import { z } from "zod";
import type { SalaryPaymentModeValue, SalaryPaymentStatusValue } from "../../domain/salary-payment.entity";

const paymentModeEnum = z.enum(["BANK_TRANSFER", "CASH", "CHEQUE", "UPI", "OTHER"]);

export const recordSalaryPaymentSchema = z.object({
  payslipId: z.string().uuid("Payslip is required."),
  amount: z.number().positive("Amount must be greater than zero."),
  paymentMode: paymentModeEnum,
  paymentDate: z.coerce.date({ message: "A valid payment date is required." }),
  referenceNumber: z.string().trim().max(100).optional(),
});
export type RecordSalaryPaymentServiceInput = z.infer<typeof recordSalaryPaymentSchema>;

export const reverseSalaryPaymentSchema = z.object({
  paymentId: z.string().uuid("Payment is required."),
  reason: z.string().trim().min(1, "A reversal reason is required.").max(500),
});
export type ReverseSalaryPaymentServiceInput = z.infer<typeof reverseSalaryPaymentSchema>;

export interface SalaryPaymentDTO {
  id: string;
  payslipId: string;
  employeeId: string;
  amount: number;
  paymentMode: SalaryPaymentModeValue;
  paymentDate: string;
  referenceNumber: string | null;
  status: SalaryPaymentStatusValue;
  reversedAt: string | null;
  reversalReason: string | null;
}
