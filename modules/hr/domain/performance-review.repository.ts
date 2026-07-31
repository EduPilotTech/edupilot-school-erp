import type { Prisma } from "@/lib/generated/prisma/client";
import type { PerformanceReviewEntity } from "./performance-review.entity";

export interface CreatePerformanceReviewInput {
  tenantId: string;
  employeeId: string;
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  rating: number;
  remarks?: string | null;
  promotionRecommended?: boolean;
  reviewedBy?: string | null;
  createdBy?: string | null;
}

// Append-only — no update/softDelete method, per the model's "immutable historical record"
// design (see the entity file's comment).
export interface PerformanceReviewRepository {
  findById(tenantId: string, id: string): Promise<PerformanceReviewEntity | null>;
  findByEmployee(tenantId: string, employeeId: string): Promise<PerformanceReviewEntity[]>;
  create(input: CreatePerformanceReviewInput, tx?: Prisma.TransactionClient): Promise<PerformanceReviewEntity>;
}
