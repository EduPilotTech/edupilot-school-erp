import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { IncomeCategory as PrismaIncomeCategory } from "@/lib/generated/prisma/client";
import type {
  CreateIncomeCategoryInput,
  IncomeCategoryRepository,
  UpdateIncomeCategoryInput,
} from "../domain/income-category.repository";
import type { IncomeCategoryEntity } from "../domain/income-category.entity";

function toEntity(row: PrismaIncomeCategory): IncomeCategoryEntity {
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

export class PrismaIncomeCategoryRepository implements IncomeCategoryRepository {
  async findById(tenantId: string, id: string): Promise<IncomeCategoryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.incomeCategory.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<IncomeCategoryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.incomeCategory.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<IncomeCategoryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.incomeCategory.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateIncomeCategoryInput): Promise<IncomeCategoryEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.incomeCategory.create({
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

  async update(tenantId: string, id: string, input: UpdateIncomeCategoryInput): Promise<IncomeCategoryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.incomeCategory.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, code: input.code, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<IncomeCategoryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.incomeCategory.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
