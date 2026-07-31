// APPEND-ONLY (close-not-edit) — mirrors StudentHostelAssignment exactly. A salary revision
// closes the current row (`effectiveTo`) and creates a new one; this row history IS the
// Increment History requirement, no separate model needed. "Current" is the row with
// `effectiveTo IS NULL`.
export interface EmployeeSalaryAssignmentEntity {
  id: string;
  tenantId: string;
  employeeId: string;
  salaryStructureId: string;
  basicSalary: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
