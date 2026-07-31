import type { Prisma } from "@/lib/generated/prisma/client";
import type { ExpenseEntity } from "./expense.entity";
import type { FinancePaymentModeValue } from "./finance-payment-mode";

export interface CreateExpenseInput {
  tenantId: string;
  schoolId: string;
  academicSessionId: string;
  expenseCategoryId: string;
  financeAccountId: string;
  amount: number;
  date: Date;
  vendor?: string | null;
  description?: string | null;
  paymentMode: FinancePaymentModeValue;
  referenceNo?: string | null;
  createdBy?: string | null;
}

export interface UpdateExpenseInput {
  academicSessionId?: string;
  expenseCategoryId?: string;
  financeAccountId?: string;
  amount?: number;
  date?: Date;
  vendor?: string | null;
  description?: string | null;
  paymentMode?: FinancePaymentModeValue;
  referenceNo?: string | null;
  updatedBy?: string | null;
}

export interface ExpenseListFilter {
  page: number;
  pageSize: number;
  academicSessionId?: string;
  expenseCategoryId?: string;
  financeAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string; // matches vendor, description, or referenceNo
}

export interface ExpenseListResult {
  items: ExpenseEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExpenseReportFilter {
  schoolId: string;
  academicSessionId?: string;
  expenseCategoryId?: string;
  financeAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface ExpenseCategoryTotal {
  expenseCategoryId: string;
  totalAmount: number;
  entryCount: number;
}

export interface ExpenseSumFilter {
  schoolId: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface ExpenseRepository {
  findById(tenantId: string, id: string): Promise<ExpenseEntity | null>;
  findMany(tenantId: string, filter: ExpenseListFilter): Promise<ExpenseListResult>;
  // Unpaginated, ordered by date desc — backs getExpenseReport (a printable report, not a UI list).
  findAllForReport(tenantId: string, filter: ExpenseReportFilter): Promise<ExpenseEntity[]>;
  create(input: CreateExpenseInput, tx?: Prisma.TransactionClient): Promise<ExpenseEntity>;
  update(tenantId: string, id: string, input: UpdateExpenseInput, tx?: Prisma.TransactionClient): Promise<ExpenseEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<ExpenseEntity>;
  // Sum of `amount` for entries matching the filter — used by the Finance Dashboard (today's /
  // this month's expense) and the Monthly Summary report. A DB-side aggregate, not a full-row read.
  sumAmount(tenantId: string, filter: ExpenseSumFilter): Promise<number>;
  // Grouped totals per ExpenseCategory (a DB-side groupBy, not an in-memory reduction over every
  // row) — backs the Category-wise Expense report.
  sumByCategory(tenantId: string, filter: ExpenseReportFilter): Promise<ExpenseCategoryTotal[]>;
}
