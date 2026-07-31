import type { Prisma } from "@/lib/generated/prisma/client";
import type { EmployeeLeaveBalanceEntity } from "./employee-leave-balance.entity";

export interface UpsertEmployeeLeaveBalanceInput {
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays?: number;
  carriedForwardDays?: number;
  updatedBy?: string | null;
}

export interface EmployeeLeaveBalanceRepository {
  findOne(tenantId: string, employeeId: string, leaveTypeId: string, year: number): Promise<EmployeeLeaveBalanceEntity | null>;
  findByEmployee(tenantId: string, employeeId: string, year: number): Promise<EmployeeLeaveBalanceEntity[]>;
  // Creates the (employee, leaveType, year) row if it doesn't exist, else updates
  // allocatedDays/carriedForwardDays (used by the admin Allocate action).
  upsertAllocation(input: UpsertEmployeeLeaveBalanceInput, tx?: Prisma.TransactionClient): Promise<EmployeeLeaveBalanceEntity>;
  // Atomically increments/decrements `usedDays` on the (employee, leaveType, year) row, creating
  // it with 0 allocated days first if none exists yet — used by leave approve/cancel-reversal.
  adjustUsedDays(
    tenantId: string,
    employeeId: string,
    leaveTypeId: string,
    year: number,
    deltaDays: number,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeLeaveBalanceEntity>;
}
