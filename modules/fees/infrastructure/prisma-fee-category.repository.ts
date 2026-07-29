import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { FeeCategory as PrismaFeeCategory } from "@/lib/generated/prisma/client";
import type {
  CreateFeeCategoryInput,
  FeeCategoryRepository,
  UpdateFeeCategoryInput,
} from "../domain/fee-category.repository";
import type { FeeCategoryEntity } from "../domain/fee-category.entity";

function toEntity(row: PrismaFeeCategory): FeeCategoryEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    code: row.code,
    isRecurring: row.isRecurring,
    hsnSacCode: row.hsnSacCode,
    taxRatePercent: row.taxRatePercent,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaFeeCategoryRepository implements FeeCategoryRepository {
  async findById(tenantId: string, id: string): Promise<FeeCategoryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeCategory.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<FeeCategoryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeCategory.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string): Promise<FeeCategoryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeCategory.findMany({ where: { tenantId, deletedAt: null }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateFeeCategoryInput): Promise<FeeCategoryEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.feeCategory.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          code: input.code,
          isRecurring: input.isRecurring,
          hsnSacCode: input.hsnSacCode ?? null,
          taxRatePercent: input.taxRatePercent ?? null,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateFeeCategoryInput): Promise<FeeCategoryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeCategory.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          code: input.code,
          isRecurring: input.isRecurring,
          hsnSacCode: input.hsnSacCode,
          taxRatePercent: input.taxRatePercent,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FeeCategoryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeCategory.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
