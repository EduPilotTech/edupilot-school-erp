import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, GradeBand as PrismaGradeBand } from "@/lib/generated/prisma/client";
import type { CreateGradeBandInput, GradeBandRepository } from "../domain/grade-scale.repository";
import type { GradeBandEntity } from "../domain/grade-scale.entity";

function toEntity(row: PrismaGradeBand): GradeBandEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    gradeScaleId: row.gradeScaleId,
    minPercentage: row.minPercentage,
    maxPercentage: row.maxPercentage,
    grade: row.grade,
    gradePoint: row.gradePoint,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaGradeBandRepository implements GradeBandRepository {
  async findByGradeScale(tenantId: string, gradeScaleId: string): Promise<GradeBandEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.gradeBand.findMany({
        where: { tenantId, gradeScaleId, deletedAt: null },
        orderBy: { minPercentage: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  // Full replace inside one transaction — see the domain interface's own comment for why this
  // is delete-then-recreate rather than an upsert (no stable natural key per band).
  async replaceAll(
    tenantId: string,
    gradeScaleId: string,
    bands: CreateGradeBandInput[],
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<GradeBandEntity[]> {
    return withTenantContext(
      tenantId,
      async (t) => {
        await t.gradeBand.deleteMany({ where: { tenantId, gradeScaleId } });
        const created = await Promise.all(
          bands.map((band) =>
            t.gradeBand.create({
              data: {
                tenantId,
                gradeScaleId,
                minPercentage: band.minPercentage,
                maxPercentage: band.maxPercentage,
                grade: band.grade,
                gradePoint: band.gradePoint ?? null,
                createdBy: updatedBy,
              },
            })
          )
        );
        return created.map(toEntity);
      },
      tx
    );
  }
}
