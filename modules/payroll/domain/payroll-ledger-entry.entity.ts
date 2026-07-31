export type PayrollLedgerEntryTypeValue = "PAYSLIP_GENERATED" | "PAYMENT" | "REVERSAL";

// Pure, append-only running ledger per employee — mirrors FeeLedgerEntry exactly, with
// debit/credit sense reversed (a payslip is a credit to the employee; a payment is a debit that
// settles it) relative to Fee's own student-owes-school direction.
export interface PayrollLedgerEntryEntity {
  id: string;
  tenantId: string;
  employeeId: string;
  entryType: PayrollLedgerEntryTypeValue;
  referenceType: string;
  referenceId: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
  createdBy: string | null;
}
