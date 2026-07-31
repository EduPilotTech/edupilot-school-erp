import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Income as PrismaIncome, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateIncomeInput,
  IncomeCategoryTotal,
  IncomeListFilter,
  IncomeListResult,
  IncomeRepository,
  IncomeReportFilter,
  IncomeSumFilter,
  UpdateIncomeInput,
} from "../domain/income.repository";
import type { IncomeEntity } from "../domain/income.entity";

function toEntity(row: PrismaIncome): IncomeEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    academicSessionId: row.academicSessionId,
    incomeCategoryId: row.incomeCategoryId,
    financeAccountId: row.financeAccountId,
    amount: row.amount.toNumber(),
    date: row.date,
    description: row.description,
    referenceNo: row.referenceNo,
    collectedBy: row.collectedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaIncomeRepository implements IncomeRepository {
  async findById(tenantId: string, id: string): Promise<IncomeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.income.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: IncomeListFilter): Promise<IncomeListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where: Prisma.IncomeWhereInput = {
        tenantId,
        deletedAt: null,
        academicSessionId: filter.academicSessionId,
        incomeCategoryId: filter.incomeCategoryId,
        financeAccountId: filter.financeAccountId,
        date: filter.fromDate || filter.toDate ? { gte: filter.fromDate, lte: filter.toDate } : undefined,
        OR: filter.search
          ? [
              { description: { contains: filter.search, mode: "insensitive" } },
              { referenceNo: { contains: filter.search, mode: "insensitive" } },
            ]
          : undefined,
      };

      const [rows, total] = await Promise.all([
        tx.income.findMany({
          where,
          orderBy: { date: "desc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.income.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async findAllForReport(tenantId: string, filter: IncomeReportFilter): Promise<IncomeEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.income.findMany({
        where: {
          tenantId,
          schoolId: filter.schoolId,
          deletedAt: null,
          academicSessionId: filter.academicSessionId,
          incomeCategoryId: filter.incomeCategoryId,
          financeAccountId: filter.financeAccountId,
          date: filter.fromDate || filter.toDate ? { gte: filter.fromDate, lte: filter.toDate } : undefined,
        },
        orderBy: { date: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateIncomeInput, tx?: Prisma.TransactionClient): Promise<IncomeEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.income.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            academicSessionId: input.academicSessionId,
            incomeCategoryId: input.incomeCategoryId,
            financeAccountId: input.financeAccountId,
            amount: input.amount,
            date: input.date,
            description: input.description ?? null,
            referenceNo: input.referenceNo ?? null,
            collectedBy: input.collectedBy ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateIncomeInput, tx?: Prisma.TransactionClient): Promise<IncomeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.income.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            academicSessionId: input.academicSessionId,
            incomeCategoryId: input.incomeCategoryId,
            financeAccountId: input.financeAccountId,
            amount: input.amount,
            date: input.date,
            description: input.description,
            referenceNo: input.referenceNo,
            collectedBy: input.collectedBy,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<IncomeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.income.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }

  async sumAmount(tenantId: string, filter: IncomeSumFilter): Promise<number> {
    const result = await withTenantContext(tenantId, (tx) =>
      tx.income.aggregate({
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

  async sumByCategory(tenantId: string, filter: IncomeReportFilter): Promise<IncomeCategoryTotal[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.income.groupBy({
        by: ["incomeCategoryId"],
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
      incomeCategoryId: row.incomeCategoryId,
      totalAmount: row._sum.amount?.toNumber() ?? 0,
      entryCount: row._count._all,
    }));
  }
}
