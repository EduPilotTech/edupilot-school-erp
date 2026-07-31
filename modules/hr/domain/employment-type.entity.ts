// Phase 13 — school-scoped lookup table (e.g. "Full-Time", "Part-Time", "Contract"), mirrors
// BookCategoryEntity's exact shape.
export interface EmploymentTypeEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
