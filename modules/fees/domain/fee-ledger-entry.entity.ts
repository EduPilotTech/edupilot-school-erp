export type FeeLedgerEntryTypeValue =
  | "INVOICE"
  | "PAYMENT"
  | "CONCESSION"
  | "REVERSAL"
  | "CANCELLATION"
  | "FINE";

export interface FeeLedgerEntryEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  entryType: FeeLedgerEntryTypeValue;
  referenceType: string;
  referenceId: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
  createdBy: string | null;
}
