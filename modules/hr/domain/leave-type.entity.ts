// Phase 13 — school-scoped lookup table, mirrors DepartmentEntity's shape plus leave-policy
// fields.
export interface LeaveTypeEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  code: string;
  maxDaysPerYear: number;
  carryForwardAllowed: boolean;
  carryForwardMaxDays: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
