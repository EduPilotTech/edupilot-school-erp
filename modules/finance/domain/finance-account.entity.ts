export type FinanceAccountTypeValue = "CASH" | "BANK";

// A single cash/bank ledger account for a school (e.g. "Petty Cash", "HDFC Main A/C"). Not a
// double-entry chart of accounts — just the set of physical/virtual places money sits.
// `currentBalance` is maintained transactionally by modules/finance's Income/Expense services
// (incremented on Income, decremented on Expense, adjusted on edit/soft-delete of either) —
// mirrors EmployeeLoan.outstandingAmount's own "maintained not derived" precedent.
export interface FinanceAccountEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  accountType: FinanceAccountTypeValue;
  openingBalance: number;
  currentBalance: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
