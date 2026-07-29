import type { FeeLedgerEntryTypeValue } from "../../domain/fee-ledger-entry.entity";

export interface FeeLedgerEntryDTO {
  id: string;
  entryType: FeeLedgerEntryTypeValue;
  referenceType: string;
  referenceId: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}
