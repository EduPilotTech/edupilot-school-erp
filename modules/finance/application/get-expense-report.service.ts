import "server-only";
import { PrismaExpenseRepository } from "../infrastructure/prisma-expense.repository";
import { PrismaExpenseCategoryRepository } from "../infrastructure/prisma-expense-category.repository";
import { PrismaFinanceAccountRepository } from "../infrastructure/prisma-finance-account.repository";
import type { ExpenseReportDTO, ExpenseReportRowDTO } from "./dto/finance-reports.dto";

export interface ExpenseReportFilterInput {
  academicSessionId?: string;
  expenseCategoryId?: string;
  financeAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Expense Report (Phase 14 spec §6.b) — the symmetric counterpart of getIncomeReport.
export async function getExpenseReport(tenantId: string, schoolId: string, filter: ExpenseReportFilterInput): Promise<ExpenseReportDTO> {
  const expenseRepository = new PrismaExpenseRepository();
  const expenseCategoryRepository = new PrismaExpenseCategoryRepository();
  const financeAccountRepository = new PrismaFinanceAccountRepository();

  const [entries, categories, accounts] = await Promise.all([
    expenseRepository.findAllForReport(tenantId, {
      schoolId,
      academicSessionId: filter.academicSessionId,
      expenseCategoryId: filter.expenseCategoryId,
      financeAccountId: filter.financeAccountId,
      fromDate: filter.fromDate,
      toDate: filter.toDate,
    }),
    expenseCategoryRepository.findMany(tenantId),
    financeAccountRepository.findMany(tenantId, schoolId),
  ]);

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]));

  const rows: ExpenseReportRowDTO[] = entries.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    amount: entry.amount,
    expenseCategoryId: entry.expenseCategoryId,
    expenseCategoryName: categoryNameById.get(entry.expenseCategoryId) ?? "",
    financeAccountId: entry.financeAccountId,
    financeAccountName: accountNameById.get(entry.financeAccountId) ?? "",
    vendor: entry.vendor,
    description: entry.description,
    paymentMode: entry.paymentMode,
    referenceNo: entry.referenceNo,
  }));

  const totalAmount = round2(rows.reduce((sum, row) => sum + row.amount, 0));

  return { rows, totalAmount };
}
