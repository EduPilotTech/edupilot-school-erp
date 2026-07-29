import type { FeeInvoiceStatusValue } from "../domain/fee-invoice.entity";

export interface InvoiceStatusInput {
  amount: number;
  discountAmount: number;
  fineAmount: number;
  amountPaid: number;
  dueDate: Date;
  asOfDate: Date;
}

export function computeNetPayable(input: { amount: number; discountAmount: number; fineAmount: number }): number {
  return Math.round((input.amount - input.discountAmount + input.fineAmount) * 100) / 100;
}

// PAID/PARTIALLY_PAID takes priority over OVERDUE — a partially paid invoice past its due date is
// still reported as PARTIALLY_PAID (the balance and days-overdue are shown separately), not
// re-labelled OVERDUE, so a cashier collecting the remaining balance sees a consistent status.
export function computeInvoiceStatus(input: InvoiceStatusInput): FeeInvoiceStatusValue {
  const netPayable = computeNetPayable(input);
  if (input.amountPaid >= netPayable && netPayable > 0) return "PAID";
  if (input.amountPaid > 0) return "PARTIALLY_PAID";
  if (input.asOfDate > input.dueDate) return "OVERDUE";
  return "PENDING";
}
