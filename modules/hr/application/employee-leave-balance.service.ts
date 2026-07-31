import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaLeaveTypeRepository } from "../infrastructure/prisma-leave-type.repository";
import { PrismaEmployeeLeaveBalanceRepository } from "../infrastructure/prisma-employee-leave-balance.repository";
import { EmployeeNotFoundError, LeaveTypeNotFoundError } from "../domain/errors";
import { allocateLeaveBalanceSchema, getLeaveBalancesSchema, type EmployeeLeaveBalanceDTO } from "./dto/leave.dto";
import { computeAvailableLeaveDays } from "./leave-balance.helpers";
import type { EmployeeLeaveBalanceEntity } from "../domain/employee-leave-balance.entity";
import type { HrContext } from "./hr-context";

function toDTO(entity: EmployeeLeaveBalanceEntity): EmployeeLeaveBalanceDTO {
  return {
    id: entity.id,
    employeeId: entity.employeeId,
    leaveTypeId: entity.leaveTypeId,
    year: entity.year,
    allocatedDays: entity.allocatedDays,
    usedDays: entity.usedDays,
    carriedForwardDays: entity.carriedForwardDays,
    availableDays: computeAvailableLeaveDays(entity),
  };
}

// Admin action — creates the (employee, leaveType, year) balance row if it doesn't exist, else
// updates its allocatedDays/carriedForwardDays.
export async function allocateLeaveBalance(input: unknown, context: HrContext): Promise<EmployeeLeaveBalanceDTO> {
  const parsed = allocateLeaveBalanceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid leave balance allocation.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const employee = await new PrismaEmployeeRepository().findById(tenantId, data.employeeId);
  if (!employee || employee.deletedAt !== null) throw new EmployeeNotFoundError();

  const leaveType = await new PrismaLeaveTypeRepository().findById(tenantId, data.leaveTypeId);
  if (!leaveType || leaveType.deletedAt !== null) throw new LeaveTypeNotFoundError();

  const repository = new PrismaEmployeeLeaveBalanceRepository();
  const balance = await repository.upsertAllocation({
    tenantId,
    employeeId: data.employeeId,
    leaveTypeId: data.leaveTypeId,
    year: data.year,
    allocatedDays: data.allocatedDays,
    carriedForwardDays: data.carriedForwardDays,
    updatedBy: actingUserId,
  });
  return toDTO(balance);
}

export async function getLeaveBalances(input: unknown, context: { tenantId: string }): Promise<EmployeeLeaveBalanceDTO[]> {
  const parsed = getLeaveBalancesSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid leave balance request.");
  }
  const { employeeId, year } = parsed.data;
  const { tenantId } = context;

  const employee = await new PrismaEmployeeRepository().findById(tenantId, employeeId);
  if (!employee || employee.deletedAt !== null) throw new EmployeeNotFoundError();

  const repository = new PrismaEmployeeLeaveBalanceRepository();
  const balances = await repository.findByEmployee(tenantId, employeeId, year);
  return balances.map(toDTO);
}

export { toDTO as toEmployeeLeaveBalanceDTO };
