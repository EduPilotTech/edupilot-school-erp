import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { PerformanceReview as PrismaPerformanceReview, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreatePerformanceReviewInput,
  PerformanceReviewRepository,
} from "../domain/performance-review.repository";
import type { PerformanceReviewEntity } from "../domain/performance-review.entity";

function toEntity(row: PrismaPerformanceReview): PerformanceReviewEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    reviewPeriodStart: row.reviewPeriodStart,
    reviewPeriodEnd: row.reviewPeriodEnd,
    rating: row.rating,
    remarks: row.remarks,
    promotionRecommended: row.promotionRecommended,
    reviewedBy: row.reviewedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaPerformanceReviewRepository implements PerformanceReviewRepository {
  async findById(tenantId: string, id: string): Promise<PerformanceReviewEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.performanceReview.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByEmployee(tenantId: string, employeeId: string): Promise<PerformanceReviewEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.performanceReview.findMany({ where: { tenantId, employeeId }, orderBy: { reviewPeriodEnd: "desc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreatePerformanceReviewInput, tx?: Prisma.TransactionClient): Promise<PerformanceReviewEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.performanceReview.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            reviewPeriodStart: input.reviewPeriodStart,
            reviewPeriodEnd: input.reviewPeriodEnd,
            rating: input.rating,
            remarks: input.remarks ?? null,
            promotionRecommended: input.promotionRecommended ?? false,
            reviewedBy: input.reviewedBy ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
