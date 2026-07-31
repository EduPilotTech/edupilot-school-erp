// Phase 13 — a lightweight, immutable historical record (create + list only, no update/delete —
// see modules/hr/application/performance-review.service.ts). No `deletedAt` column on this
// model (schema-verified).
export interface PerformanceReviewEntity {
  id: string;
  tenantId: string;
  employeeId: string;
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  rating: number;
  remarks: string | null;
  promotionRecommended: boolean;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
