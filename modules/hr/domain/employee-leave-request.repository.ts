import type { Prisma } from "@/lib/generated/prisma/client";
import type { EmployeeLeaveRequestEntity, LeaveRequestStatusValue } from "./employee-leave-request.entity";

export interface CreateEmployeeLeaveRequestInput {
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: Date;
  toDate: Date;
  isHalfDay: boolean;
  totalDays: number;
  reason: string;
  createdBy?: string | null;
}

export interface DecideEmployeeLeaveRequestInput {
  status: Extract<LeaveRequestStatusValue, "APPROVED" | "REJECTED">;
  approvedBy: string | null;
  approvedAt: Date;
  rejectionReason?: string | null;
  updatedBy?: string | null;
}

export interface EmployeeLeaveRequestFilter {
  employeeId?: string;
  status?: LeaveRequestStatusValue;
  fromDate?: Date;
  toDate?: Date;
}

export interface EmployeeLeaveRequestRepository {
  findById(tenantId: string, id: string): Promise<EmployeeLeaveRequestEntity | null>;
  findMany(tenantId: string, filter: EmployeeLeaveRequestFilter): Promise<EmployeeLeaveRequestEntity[]>;
  create(input: CreateEmployeeLeaveRequestInput, tx?: Prisma.TransactionClient): Promise<EmployeeLeaveRequestEntity>;
  decide(tenantId: string, id: string, input: DecideEmployeeLeaveRequestInput, tx?: Prisma.TransactionClient): Promise<EmployeeLeaveRequestEntity>;
  cancel(tenantId: string, id: string, updatedBy: string | null, tx?: Prisma.TransactionClient): Promise<EmployeeLeaveRequestEntity>;
}
