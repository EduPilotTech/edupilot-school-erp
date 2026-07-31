import "server-only";
import { PrismaIncomeRepository } from "../infrastructure/prisma-income.repository";
import { PrismaIncomeCategoryRepository } from "../infrastructure/prisma-income-category.repository";
import type { CategoryWiseIncomeReportDTO, CategoryWiseIncomeRowDTO } from "./dto/finance-reports.dto";

export interface CategoryWiseIncomeReportFilterInput {
  academicSessionId?: string;
  fromDate?: Date;
  toDate?: Date;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Category-wise Income Report (Phase 14 spec §6.c) — totals grouped by IncomeCategory via a
// DB-side groupBy (PrismaIncomeRepository.sumByCategory), not an in-memory reduction over every
// row.
export async function getCategoryWiseIncomeReport(
  tenantId: string,
  schoolId: string,
  filter: CategoryWiseIncomeReportFilterInput
): Promise<CategoryWiseIncomeReportDTO> {
  const incomeRepository = new PrismaIncomeRepository();
  const incomeCategoryRepository = new PrismaIncomeCategoryRepository();

  const [totals, categories] = await Promise.all([
    incomeRepository.sumByCategory(tenantId, {
      schoolId,
      academicSessionId: filter.academicSessionId,
      fromDate: filter.fromDate,
      toDate: filter.toDate,
    }),
    incomeCategoryRepository.findMany(tenantId),
  ]);

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const rows: CategoryWiseIncomeRowDTO[] = totals.map((total) => ({
    incomeCategoryId: total.incomeCategoryId,
    categoryName: categoryNameById.get(total.incomeCategoryId) ?? "",
    totalAmount: total.totalAmount,
    entryCount: total.entryCount,
  }));

  const grandTotal = round2(rows.reduce((sum, row) => sum + row.totalAmount, 0));

  return { rows, grandTotal };
}
