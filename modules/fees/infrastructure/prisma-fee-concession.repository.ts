import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { FeeConcession as PrismaFeeConcession } from "@/lib/generated/prisma/client";
import type { CreateFeeConcessionInput, FeeConcessionRepository } from "../domain/fee-concession.repository";
import type {
  FeeConcessionEntity,
  FeeConcessionTypeValue,
  FeeConcessionValueTypeValue,
} from "../domain/fee-concession.entity";

function toEntity(row: PrismaFeeConcession): FeeConcessionEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    feeCategoryId: row.feeCategoryId,
    type: row.type as FeeConcessionTypeValue,
    valueType: row.valueType as FeeConcessionValueTypeValue,
    value: row.value.toNumber(),
    reason: row.reason,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaFeeConcessionRepository implements FeeConcessionRepository {
  async findById(tenantId: string, id: string): Promise<FeeConcessionEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeConcession.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<FeeConcessionEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeConcession.findMany({
        where: { tenantId, studentId, academicSessionId, deletedAt: null, isActive: true },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateFeeConcessionInput): Promise<FeeConcessionEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.feeConcession.create({
        data: {
          tenantId: input.tenantId,
          studentId: input.studentId,
          academicSessionId: input.academicSessionId,
          feeCategoryId: input.feeCategoryId ?? null,
          type: input.type,
          valueType: input.valueType,
          value: input.value,
          reason: input.reason ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FeeConcessionEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeConcession.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
