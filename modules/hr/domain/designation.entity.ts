// Phase 13 — school-scoped lookup table. `departmentId` is optional — a designation may be
// department-agnostic (e.g. "Librarian" doesn't sit under an academic department).
export interface DesignationEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  departmentId: string | null;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
