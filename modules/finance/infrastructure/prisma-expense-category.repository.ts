import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { ExpenseCategory as PrismaExpenseCategory } from "@/lib/generated/prisma/client";
import type {
  CreateExpenseCategoryInput,
  ExpenseCategoryRepository,
  UpdateExpenseCategoryInput,
} from "../domain/expense-category.repository";
import type { ExpenseCategoryEntity } from "../domain/expense-category.entity";

function toEntity(row: PrismaExpenseCategory): ExpenseCategoryEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    code: row.code,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaExpenseCategoryRepository implements ExpenseCategoryRepository {
  async findById(tenantId: string, id: string): Promise<ExpenseCategoryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.expenseCategory.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<ExpenseCategoryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.expenseCategory.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<ExpenseCategoryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.expenseCategory.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateExpenseCategoryInput): Promise<ExpenseCategoryEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.expenseCategory.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateExpenseCategoryInput): Promise<ExpenseCategoryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.expenseCategory.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, code: input.code, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ExpenseCategoryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.expenseCategory.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
