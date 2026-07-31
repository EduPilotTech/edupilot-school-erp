import "server-only";
import { PrismaIncomeRepository } from "../infrastructure/prisma-income.repository";
import { PrismaIncomeCategoryRepository } from "../infrastructure/prisma-income-category.repository";
import { PrismaFinanceAccountRepository } from "../infrastructure/prisma-finance-account.repository";
import type { IncomeReportDTO, IncomeReportRowDTO } from "./dto/finance-reports.dto";

export interface IncomeReportFilterInput {
  academicSessionId?: string;
  incomeCategoryId?: string;
  financeAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Income Report (Phase 14 spec §6.a) — every matching Income entry, joined with its category and
// account names. `schoolId` scopes the report to one school within the tenant, the same way every
// other dashboard/report in this codebase does (see get-finance-dashboard.service.ts,
// get-hr-dashboard.service.ts).
export async function getIncomeReport(tenantId: string, schoolId: string, filter: IncomeReportFilterInput): Promise<IncomeReportDTO> {
  const incomeRepository = new PrismaIncomeRepository();
  const incomeCategoryRepository = new PrismaIncomeCategoryRepository();
  const financeAccountRepository = new PrismaFinanceAccountRepository();

  const [entries, categories, accounts] = await Promise.all([
    incomeRepository.findAllForReport(tenantId, {
      schoolId,
      academicSessionId: filter.academicSessionId,
      incomeCategoryId: filter.incomeCategoryId,
      financeAccountId: filter.financeAccountId,
      fromDate: filter.fromDate,
      toDate: filter.toDate,
    }),
    incomeCategoryRepository.findMany(tenantId),
    financeAccountRepository.findMany(tenantId, schoolId),
  ]);

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const accountNameById = new Map(accounts.map((account) => [account.id, account.name]));

  const rows: IncomeReportRowDTO[] = entries.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    amount: entry.amount,
    incomeCategoryId: entry.incomeCategoryId,
    incomeCategoryName: categoryNameById.get(entry.incomeCategoryId) ?? "",
    financeAccountId: entry.financeAccountId,
    financeAccountName: accountNameById.get(entry.financeAccountId) ?? "",
    description: entry.description,
    referenceNo: entry.referenceNo,
  }));

  const totalAmount = round2(rows.reduce((sum, row) => sum + row.amount, 0));

  return { rows, totalAmount };
}
