import "server-only";
import { PrismaIncomeRepository } from "../infrastructure/prisma-income.repository";
import { PrismaExpenseRepository } from "../infrastructure/prisma-expense.repository";
import type { MonthlySummaryReportDTO, MonthlySummaryRowDTO } from "./dto/finance-reports.dto";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// First and last day of calendar month `monthIndex` (0-based, January = 0) of `year`, both at UTC
// midnight — day 0 of the following month is this month's last day.
function monthRange(year: number, monthIndex: number): { start: Date; end: Date } {
  return { start: new Date(Date.UTC(year, monthIndex, 1)), end: new Date(Date.UTC(year, monthIndex + 1, 0)) };
}

// Monthly Summary Report (Phase 14 spec §6.e) — income/expense/net totals for each of the 12
// calendar months of `year`, via one DB-side sum aggregate per month per ledger (see
// PrismaIncomeRepository.sumAmount/PrismaExpenseRepository.sumAmount) rather than reading every
// entry for the year into memory.
export async function getMonthlySummaryReport(tenantId: string, schoolId: string, year: number): Promise<MonthlySummaryReportDTO> {
  const incomeRepository = new PrismaIncomeRepository();
  const expenseRepository = new PrismaExpenseRepository();

  const rows: MonthlySummaryRowDTO[] = await Promise.all(
    Array.from({ length: 12 }, (_, monthIndex) => monthIndex).map(async (monthIndex): Promise<MonthlySummaryRowDTO> => {
      const { start, end } = monthRange(year, monthIndex);

      const [totalIncome, totalExpense] = await Promise.all([
        incomeRepository.sumAmount(tenantId, { schoolId, fromDate: start, toDate: end }),
        expenseRepository.sumAmount(tenantId, { schoolId, fromDate: start, toDate: end }),
      ]);

      return {
        month: monthIndex + 1,
        totalIncome: round2(totalIncome),
        totalExpense: round2(totalExpense),
        netAmount: round2(totalIncome - totalExpense),
      };
    })
  );

  return { year, rows };
}
