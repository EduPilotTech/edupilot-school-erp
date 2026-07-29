import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, GradeScale as PrismaGradeScale } from "@/lib/generated/prisma/client";
import type { CreateGradeScaleInput, GradeScaleRepository } from "../domain/grade-scale.repository";
import type { GradeScaleEntity } from "../domain/grade-scale.entity";

function toEntity(row: PrismaGradeScale): GradeScaleEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaGradeScaleRepository implements GradeScaleRepository {
  async findById(tenantId: string, id: string): Promise<GradeScaleEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.gradeScale.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByName(tenantId: string, academicSessionId: string, name: string): Promise<GradeScaleEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.gradeScale.findUnique({
        where: { tenantId_academicSessionId_name: { tenantId, academicSessionId, name } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<GradeScaleEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.gradeScale.findMany({
        where: { tenantId, academicSessionId, deletedAt: null },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateGradeScaleInput, tx?: Prisma.TransactionClient): Promise<GradeScaleEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.gradeScale.create({
          data: {
            tenantId: input.tenantId,
            academicSessionId: input.academicSessionId,
            name: input.name,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<GradeScaleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.gradeScale.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
