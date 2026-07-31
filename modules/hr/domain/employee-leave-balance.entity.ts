// Phase 13 — one row per (employee, leaveType, year): the Leave Allocation + running balance +
// carry-forward record. No prior precedent in this codebase — genuinely new.
export interface EmployeeLeaveBalanceEntity {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  carriedForwardDays: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
