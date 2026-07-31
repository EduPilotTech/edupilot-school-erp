// Phase 13 — mirrors HostelLeaveRequestEntity's exact request/approve/reject shape.
export type LeaveRequestStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface EmployeeLeaveRequestEntity {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: Date;
  toDate: Date;
  isHalfDay: boolean;
  totalDays: number;
  reason: string;
  status: LeaveRequestStatusValue;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
