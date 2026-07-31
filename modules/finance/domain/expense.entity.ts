import type { FinancePaymentModeValue } from "./finance-payment-mode";

// A single expense posting against one FinanceAccount, categorized by ExpenseCategory and scoped
// to an AcademicSession — the symmetric counterpart of IncomeEntity. Independently
// editable/soft-deletable, per the Phase 14 "simple ledger" scope (see IncomeEntity's own
// comment).
export interface ExpenseEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  academicSessionId: string;
  expenseCategoryId: string;
  financeAccountId: string;
  amount: number;
  date: Date;
  vendor: string | null;
  description: string | null;
  paymentMode: FinancePaymentModeValue;
  referenceNo: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
