export type HostelLeaveTypeValue = "REGULAR" | "EMERGENCY" | "WEEKEND";
export type HostelLeaveStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface HostelLeaveRequestEntity {
  id: string;
  tenantId: string;
  studentId: string;
  studentHostelAssignmentId: string;
  leaveType: HostelLeaveTypeValue;
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: HostelLeaveStatusValue;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  actualReturnDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
