import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Expense as PrismaExpense, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateExpenseInput,
  ExpenseCategoryTotal,
  ExpenseListFilter,
  ExpenseListResult,
  ExpenseRepository,
  ExpenseReportFilter,
  ExpenseSumFilter,
  UpdateExpenseInput,
} from "../domain/expense.repository";
import type { ExpenseEntity } from "../domain/expense.entity";
import type { FinancePaymentModeValue } from "../domain/finance-payment-mode";

function toEntity(row: PrismaExpense): ExpenseEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    academicSessionId: row.academicSessionId,
    expenseCategoryId: row.expenseCategoryId,
    financeAccountId: row.financeAccountId,
    amount: row.amount.toNumber(),
    date: row.date,
    vendor: row.vendor,
    description: row.description,
    paymentMode: row.paymentMode as FinancePaymentModeValue,
    referenceNo: row.referenceNo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaExpenseRepository implements ExpenseRepository {
  async findById(tenantId: string, id: string): Promise<ExpenseEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.expense.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: ExpenseListFilter): Promise<ExpenseListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where: Prisma.ExpenseWhereInput = {
        tenantId,
        deletedAt: null,
        academicSessionId: filter.academicSessionId,
        expenseCategoryId: filter.expenseCategoryId,
        financeAccountId: filter.financeAccountId,
        date: filter.fromDate || filter.toDate ? { gte: filter.fromDate, lte: filter.toDate } : undefined,
        OR: filter.search
          ? [
              { vendor: { contains: filter.search, mode: "insensitive" } },
              { description: { contains: filter.search, mode: "insensitive" } },
              { referenceNo: { contains: filter.search, mode: "insensitive" } },
            ]
          : undefined,
      };

      const [rows, total] = await Promise.all([
        tx.expense.findMany({
          where,
          orderBy: { date: "desc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.expense.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async findAllForReport(tenantId: string, filter: ExpenseReportFilter): Promise<ExpenseEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.expense.findMany({
        where: {
          tenantId,
          schoolId: filter.schoolId,
          deletedAt: null,
          academicSessionId: filter.academicSessionId,
          expenseCategoryId: filter.expenseCategoryId,
          financeAccountId: filter.financeAccountId,
          date: filter.fromDate || filter.toDate ? { gte: filter.fromDate, lte: filter.toDate } : undefined,
        },
        orderBy: { date: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateExpenseInput, tx?: Prisma.TransactionClient): Promise<ExpenseEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.expense.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            academicSessionId: input.academicSessionId,
            expenseCategoryId: input.expenseCategoryId,
            financeAccountId: input.financeAccountId,
            amount: input.amount,
            date: input.date,
            vendor: input.vendor ?? null,
            description: input.description ?? null,
            paymentMode: input.paymentMode,
            referenceNo: input.referenceNo ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateExpenseInput, tx?: Prisma.TransactionClient): Promise<ExpenseEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.expense.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            academicSessionId: input.academicSessionId,
            expenseCategoryId: input.expenseCategoryId,
            financeAccountId: input.financeAccountId,
            amount: input.amount,
            date: input.date,
            vendor: input.vendor,
            description: input.description,
            paymentMode: input.paymentMode,
            referenceNo: input.referenceNo,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<ExpenseEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.expense.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }

  async sumAmount(tenantId: string, filter: ExpenseSumFilter): Promise<number> {
    const result = await withTenantContext(tenantId, (tx) =>
      tx.expense.aggregate({
        where: {
          tenantId,
          schoolId: filter.schoolId,
          deletedAt: null,
          date: filter.fromDate || filter.toDate ? { gte: filter.fromDate, lte: filter.toDate } : undefined,
        },
        _sum: { amount: true },
      })
    );
    return result._sum.amount?.toNumber() ?? 0;
  }

  async sumByCategory(tenantId: string, filter: ExpenseReportFilter): Promise<ExpenseCategoryTotal[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.expense.groupBy({
        by: ["expenseCategoryId"],
        where: {
          tenantId,
          schoolId: filter.schoolId,
          deletedAt: null,
          academicSessionId: filter.academicSessionId,
          date: filter.fromDate || filter.toDate ? { gte: filter.fromDate, lte: filter.toDate } : undefined,
        },
        _sum: { amount: true },
        _count: { _all: true },
      })
    );
    return rows.map((row) => ({
      expenseCategoryId: row.expenseCategoryId,
      totalAmount: row._sum.amount?.toNumber() ?? 0,
      entryCount: row._count._all,
    }));
  }
}
