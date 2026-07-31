import "server-only";
import { PrismaExpenseRepository } from "../infrastructure/prisma-expense.repository";
import { PrismaExpenseCategoryRepository } from "../infrastructure/prisma-expense-category.repository";
import type { CategoryWiseExpenseReportDTO, CategoryWiseExpenseRowDTO } from "./dto/finance-reports.dto";

export interface CategoryWiseExpenseReportFilterInput {
  academicSessionId?: string;
  fromDate?: Date;
  toDate?: Date;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Category-wise Expense Report (Phase 14 spec §6.d) — the symmetric counterpart of
// getCategoryWiseIncomeReport.
export async function getCategoryWiseExpenseReport(
  tenantId: string,
  schoolId: string,
  filter: CategoryWiseExpenseReportFilterInput
): Promise<CategoryWiseExpenseReportDTO> {
  const expenseRepository = new PrismaExpenseRepository();
  const expenseCategoryRepository = new PrismaExpenseCategoryRepository();

  const [totals, categories] = await Promise.all([
    expenseRepository.sumByCategory(tenantId, {
      schoolId,
      academicSessionId: filter.academicSessionId,
      fromDate: filter.fromDate,
      toDate: filter.toDate,
    }),
    expenseCategoryRepository.findMany(tenantId),
  ]);

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const rows: CategoryWiseExpenseRowDTO[] = totals.map((total) => ({
    expenseCategoryId: total.expenseCategoryId,
    categoryName: categoryNameById.get(total.expenseCategoryId) ?? "",
    totalAmount: total.totalAmount,
    entryCount: total.entryCount,
  }));

  const grandTotal = round2(rows.reduce((sum, row) => sum + row.totalAmount, 0));

  return { rows, grandTotal };
}
