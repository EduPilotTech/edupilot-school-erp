import type { FinancePaymentModeValue } from "../../domain/finance-payment-mode";

// Phase 14 spec §6 — Finance read-only reports. Plain interfaces, no zod (mirrors
// modules/payroll/application/dto/payroll-reports.dto.ts's own "reports need no input schema"
// precedent — these are query params/read models, not user-submitted forms).

// --- Income Report --------------------------------------------------------------------------

export interface IncomeReportRowDTO {
  id: string;
  date: string;
  amount: number;
  incomeCategoryId: string;
  incomeCategoryName: string;
  financeAccountId: string;
  financeAccountName: string;
  description: string | null;
  referenceNo: string | null;
}

export interface IncomeReportDTO {
  rows: IncomeReportRowDTO[];
  totalAmount: number;
}

// --- Expense Report -------------------------------------------------------------------------

export interface ExpenseReportRowDTO {
  id: string;
  date: string;
  amount: number;
  expenseCategoryId: string;
  expenseCategoryName: string;
  financeAccountId: string;
  financeAccountName: string;
  vendor: string | null;
  description: string | null;
  paymentMode: FinancePaymentModeValue;
  referenceNo: string | null;
}

export interface ExpenseReportDTO {
  rows: ExpenseReportRowDTO[];
  totalAmount: number;
}

// --- Category-wise Income Report -------------------------------------------------------------

export interface CategoryWiseIncomeRowDTO {
  incomeCategoryId: string;
  categoryName: string;
  totalAmount: number;
  entryCount: number;
}

export interface CategoryWiseIncomeReportDTO {
  rows: CategoryWiseIncomeRowDTO[];
  grandTotal: number;
}

// --- Category-wise Expense Report -------------------------------------------------------------

export interface CategoryWiseExpenseRowDTO {
  expenseCategoryId: string;
  categoryName: string;
  totalAmount: number;
  entryCount: number;
}

export interface CategoryWiseExpenseReportDTO {
  rows: CategoryWiseExpenseRowDTO[];
  grandTotal: number;
}

// --- Monthly Summary Report -------------------------------------------------------------------

export interface MonthlySummaryRowDTO {
  month: number; // 1 (January) through 12 (December)
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
}

export interface MonthlySummaryReportDTO {
  year: number;
  rows: MonthlySummaryRowDTO[];
}
