import "server-only";
import { PrismaIncomeRepository } from "../infrastructure/prisma-income.repository";
import { PrismaExpenseRepository } from "../infrastructure/prisma-expense.repository";
import { PrismaFinanceAccountRepository } from "../infrastructure/prisma-finance-account.repository";
import type { FinanceDashboardDTO } from "./dto/finance-dashboard.dto";

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

// Last calendar day of `date`'s month, at UTC midnight — day 0 of the following month is the
// previous month's last day.
function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Finance Dashboard (Phase 14 spec §5) — composes Income/Expense aggregates and FinanceAccount
// balances into one summary, mirroring get-hr-dashboard.service.ts's own "several KPI numbers
// composed into one DTO" shape.
export async function getFinanceDashboard(tenantId: string, schoolId: string): Promise<FinanceDashboardDTO> {
  const incomeRepository = new PrismaIncomeRepository();
  const expenseRepository = new PrismaExpenseRepository();
  const financeAccountRepository = new PrismaFinanceAccountRepository();

  const now = new Date();
  const today = startOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [todaysIncome, todaysExpense, monthlyIncome, monthlyExpense, cashAccounts, bankAccounts] = await Promise.all([
    incomeRepository.sumAmount(tenantId, { schoolId, fromDate: today, toDate: today }),
    expenseRepository.sumAmount(tenantId, { schoolId, fromDate: today, toDate: today }),
    incomeRepository.sumAmount(tenantId, { schoolId, fromDate: monthStart, toDate: monthEnd }),
    expenseRepository.sumAmount(tenantId, { schoolId, fromDate: monthStart, toDate: monthEnd }),
    financeAccountRepository.findMany(tenantId, schoolId, { isActive: true, accountType: "CASH" }),
    financeAccountRepository.findMany(tenantId, schoolId, { isActive: true, accountType: "BANK" }),
  ]);

  const currentCashBalance = round2(cashAccounts.reduce((sum, account) => sum + account.currentBalance, 0));
  const currentBankBalance = round2(bankAccounts.reduce((sum, account) => sum + account.currentBalance, 0));

  return {
    todaysIncome: round2(todaysIncome),
    todaysExpense: round2(todaysExpense),
    monthlyIncome: round2(monthlyIncome),
    monthlyExpense: round2(monthlyExpense),
    currentCashBalance,
    currentBankBalance,
  };
}
