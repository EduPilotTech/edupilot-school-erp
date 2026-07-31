import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaLeaveTypeRepository } from "../infrastructure/prisma-leave-type.repository";
import { PrismaEmployeeLeaveBalanceRepository } from "../infrastructure/prisma-employee-leave-balance.repository";
import { PrismaEmployeeLeaveRequestRepository } from "../infrastructure/prisma-employee-leave-request.repository";
import { EmployeeNotFoundError, InsufficientLeaveBalanceError, LeaveTypeNotFoundError } from "../domain/errors";
import { applyForLeaveSchema, type EmployeeLeaveRequestDTO } from "./dto/leave.dto";
import { computeAvailableLeaveDays } from "./leave-balance.helpers";
import type { EmployeeLeaveRequestEntity } from "../domain/employee-leave-request.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: EmployeeLeaveRequestEntity): EmployeeLeaveRequestDTO {
  return {
    id: entity.id,
    employeeId: entity.employeeId,
    leaveTypeId: entity.leaveTypeId,
    fromDate: entity.fromDate.toISOString().slice(0, 10),
    toDate: entity.toDate.toISOString().slice(0, 10),
    isHalfDay: entity.isHalfDay,
    totalDays: entity.totalDays,
    reason: entity.reason,
    status: entity.status,
    approvedBy: entity.approvedBy,
    approvedAt: entity.approvedAt ? entity.approvedAt.toISOString() : null,
    rejectionReason: entity.rejectionReason,
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Inclusive day count between fromDate and toDate; a half-day request is always exactly 0.5 days
// regardless of the date range (a half-day leave spans a single working day).
function computeTotalDays(fromDate: Date, toDate: Date, isHalfDay: boolean): number {
  if (isHalfDay) return 0.5;
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / MS_PER_DAY) + 1;
  return days;
}

export async function applyForLeave(input: unknown, context: HrContext): Promise<EmployeeLeaveRequestDTO> {
  const parsed = applyForLeaveSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid leave application.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  if (data.toDate < data.fromDate) {
    throw new ValidationError("The end date cannot be before the start date.");
  }

  const employee = await new PrismaEmployeeRepository().findById(tenantId, data.employeeId);
  if (!employee || employee.deletedAt !== null) throw new EmployeeNotFoundError();

  const leaveType = await new PrismaLeaveTypeRepository().findById(tenantId, data.leaveTypeId);
  if (!leaveType || leaveType.deletedAt !== null) throw new LeaveTypeNotFoundError();

  const isHalfDay = data.isHalfDay ?? false;
  const totalDays = computeTotalDays(data.fromDate, data.toDate, isHalfDay);

  const balanceRepository = new PrismaEmployeeLeaveBalanceRepository();
  const year = data.fromDate.getUTCFullYear();
  const balance = await balanceRepository.findOne(tenantId, data.employeeId, data.leaveTypeId, year);
  const available = balance ? computeAvailableLeaveDays(balance) : 0;
  if (totalDays > available) {
    throw new InsufficientLeaveBalanceError(
      `This employee has only ${available} day(s) of ${leaveType.name} available, but requested ${totalDays}.`
    );
  }

  const repository = new PrismaEmployeeLeaveRequestRepository();
  const request = await repository.create({
    tenantId,
    employeeId: data.employeeId,
    leaveTypeId: data.leaveTypeId,
    fromDate: data.fromDate,
    toDate: data.toDate,
    isHalfDay,
    totalDays,
    reason: data.reason,
    createdBy: actingUserId,
  });
  return toDTO(request);
}

export { toDTO as toEmployeeLeaveRequestDTO, computeTotalDays };
