import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaPerformanceReviewRepository } from "../infrastructure/prisma-performance-review.repository";
import { EmployeeNotFoundError, PerformanceReviewNotFoundError } from "../domain/errors";
import { createPerformanceReviewSchema, type PerformanceReviewDTO } from "./dto/performance-review.dto";
import type { PerformanceReviewEntity } from "../domain/performance-review.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: PerformanceReviewEntity): PerformanceReviewDTO {
  return {
    id: entity.id,
    employeeId: entity.employeeId,
    reviewPeriodStart: entity.reviewPeriodStart.toISOString().slice(0, 10),
    reviewPeriodEnd: entity.reviewPeriodEnd.toISOString().slice(0, 10),
    rating: entity.rating,
    remarks: entity.remarks,
    promotionRecommended: entity.promotionRecommended,
    reviewedBy: entity.reviewedBy,
  };
}

// A review is an immutable historical record once created — append-only, mirroring
// MarksEntry/FeeAuditLog's own "create, don't edit" discipline. No update/delete service exists.
export async function createPerformanceReview(input: unknown, context: HrContext): Promise<PerformanceReviewDTO> {
  const parsed = createPerformanceReviewSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid performance review data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const employee = await new PrismaEmployeeRepository().findById(tenantId, data.employeeId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  const repository = new PrismaPerformanceReviewRepository();
  const review = await repository.create({
    tenantId,
    employeeId: data.employeeId,
    reviewPeriodStart: data.reviewPeriodStart,
    reviewPeriodEnd: data.reviewPeriodEnd,
    rating: data.rating,
    remarks: data.remarks ?? null,
    promotionRecommended: data.promotionRecommended,
    reviewedBy: data.reviewedBy ?? actingUserId,
    createdBy: actingUserId,
  });
  return toDTO(review);
}

export async function getPerformanceReviewById(id: string, context: { tenantId: string }): Promise<PerformanceReviewDTO> {
  const repository = new PrismaPerformanceReviewRepository();
  const review = await repository.findById(context.tenantId, id);
  if (!review) throw new PerformanceReviewNotFoundError();
  return toDTO(review);
}

export async function listPerformanceReviews(tenantId: string, employeeId: string): Promise<PerformanceReviewDTO[]> {
  const repository = new PrismaPerformanceReviewRepository();
  const reviews = await repository.findByEmployee(tenantId, employeeId);
  return reviews.map(toDTO);
}
