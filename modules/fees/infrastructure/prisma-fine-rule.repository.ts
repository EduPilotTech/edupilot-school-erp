import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { FineRule as PrismaFineRule } from "@/lib/generated/prisma/client";
import type {
  CreateFineRuleInput,
  FineRuleRepository,
  UpdateFineRuleInput,
} from "../domain/fine-rule.repository";
import type { FineRuleEntity, FineTypeValue } from "../domain/fine-rule.entity";

function toEntity(row: PrismaFineRule): FineRuleEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    feeCategoryId: row.feeCategoryId,
    name: row.name,
    gracePeriodDays: row.gracePeriodDays,
    fineType: row.fineType as FineTypeValue,
    fineValue: row.fineValue.toNumber(),
    maxFineAmount: row.maxFineAmount ? row.maxFineAmount.toNumber() : null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaFineRuleRepository implements FineRuleRepository {
  async findById(tenantId: string, id: string): Promise<FineRuleEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.fineRule.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<FineRuleEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.fineRule.findMany({
        where: { tenantId, academicSessionId, deletedAt: null, isActive: true },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateFineRuleInput): Promise<FineRuleEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.fineRule.create({
        data: {
          tenantId: input.tenantId,
          academicSessionId: input.academicSessionId,
          feeCategoryId: input.feeCategoryId ?? null,
          name: input.name,
          gracePeriodDays: input.gracePeriodDays,
          fineType: input.fineType,
          fineValue: input.fineValue,
          maxFineAmount: input.maxFineAmount ?? null,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateFineRuleInput): Promise<FineRuleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.fineRule.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          gracePeriodDays: input.gracePeriodDays,
          fineType: input.fineType,
          fineValue: input.fineValue,
          maxFineAmount: input.maxFineAmount,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FineRuleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.fineRule.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
