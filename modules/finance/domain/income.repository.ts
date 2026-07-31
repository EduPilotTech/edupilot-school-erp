import type { Prisma } from "@/lib/generated/prisma/client";
import type { IncomeEntity } from "./income.entity";

export interface CreateIncomeInput {
  tenantId: string;
  schoolId: string;
  academicSessionId: string;
  incomeCategoryId: string;
  financeAccountId: string;
  amount: number;
  date: Date;
  description?: string | null;
  referenceNo?: string | null;
  collectedBy?: string | null;
  createdBy?: string | null;
}

export interface UpdateIncomeInput {
  academicSessionId?: string;
  incomeCategoryId?: string;
  financeAccountId?: string;
  amount?: number;
  date?: Date;
  description?: string | null;
  referenceNo?: string | null;
  collectedBy?: string | null;
  updatedBy?: string | null;
}

export interface IncomeListFilter {
  page: number;
  pageSize: number;
  academicSessionId?: string;
  incomeCategoryId?: string;
  financeAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string; // matches description or referenceNo
}

export interface IncomeListResult {
  items: IncomeEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IncomeReportFilter {
  schoolId: string;
  academicSessionId?: string;
  incomeCategoryId?: string;
  financeAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface IncomeCategoryTotal {
  incomeCategoryId: string;
  totalAmount: number;
  entryCount: number;
}

export interface IncomeSumFilter {
  schoolId: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface IncomeRepository {
  findById(tenantId: string, id: string): Promise<IncomeEntity | null>;
  findMany(tenantId: string, filter: IncomeListFilter): Promise<IncomeListResult>;
  // Unpaginated, ordered by date desc — backs getIncomeReport (a printable report, not a UI list).
  findAllForReport(tenantId: string, filter: IncomeReportFilter): Promise<IncomeEntity[]>;
  create(input: CreateIncomeInput, tx?: Prisma.TransactionClient): Promise<IncomeEntity>;
  update(tenantId: string, id: string, input: UpdateIncomeInput, tx?: Prisma.TransactionClient): Promise<IncomeEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<IncomeEntity>;
  // Sum of `amount` for entries matching the filter — used by the Finance Dashboard (today's /
  // this month's income) and the Monthly Summary report. A DB-side aggregate, not a full-row read.
  sumAmount(tenantId: string, filter: IncomeSumFilter): Promise<number>;
  // Grouped totals per IncomeCategory (a DB-side groupBy, not an in-memory reduction over every
  // row) — backs the Category-wise Income report.
  sumByCategory(tenantId: string, filter: IncomeReportFilter): Promise<IncomeCategoryTotal[]>;
}
