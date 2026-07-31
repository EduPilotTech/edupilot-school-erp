// A single income posting against one FinanceAccount, categorized by IncomeCategory and scoped to
// an AcademicSession (mirrors FeeInvoice's own "carries academicSessionId for report scoping"
// precedent). Unlike FeePayment (immutable-once-settled receipt), this row is independently
// editable/soft-deletable — a school bookkeeper can correct a mis-entered income record — per the
// Phase 14 "simple ledger, not double-entry accounting" scope.
export interface IncomeEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  academicSessionId: string;
  incomeCategoryId: string;
  financeAccountId: string;
  amount: number;
  date: Date;
  description: string | null;
  referenceNo: string | null;
  collectedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
