import type { HostelLeaveRequestEntity, HostelLeaveStatusValue, HostelLeaveTypeValue } from "./hostel-leave-request.entity";

export interface CreateHostelLeaveRequestInput {
  tenantId: string;
  studentId: string;
  studentHostelAssignmentId: string;
  leaveType: HostelLeaveTypeValue;
  fromDate: Date;
  toDate: Date;
  reason: string;
  createdBy?: string | null;
}

export interface DecideHostelLeaveRequestInput {
  status: HostelLeaveStatusValue;
  approvedBy: string | null;
  approvedAt: Date;
  rejectionReason?: string | null;
  updatedBy?: string | null;
}

export interface HostelLeaveRequestRepository {
  findById(tenantId: string, id: string): Promise<HostelLeaveRequestEntity | null>;
  findByStudent(tenantId: string, studentId: string): Promise<HostelLeaveRequestEntity[]>;
  findByStatus(tenantId: string, status: HostelLeaveStatusValue): Promise<HostelLeaveRequestEntity[]>;
  create(input: CreateHostelLeaveRequestInput): Promise<HostelLeaveRequestEntity>;
  decide(tenantId: string, id: string, input: DecideHostelLeaveRequestInput): Promise<HostelLeaveRequestEntity>;
  recordReturn(
    tenantId: string,
    id: string,
    actualReturnDate: Date,
    updatedBy: string | null
  ): Promise<HostelLeaveRequestEntity>;
  cancel(tenantId: string, id: string, updatedBy: string | null): Promise<HostelLeaveRequestEntity>;
}
