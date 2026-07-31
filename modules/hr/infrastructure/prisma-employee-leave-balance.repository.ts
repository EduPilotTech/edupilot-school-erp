import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { EmployeeLeaveBalance as PrismaEmployeeLeaveBalance, Prisma } from "@/lib/generated/prisma/client";
import type {
  EmployeeLeaveBalanceRepository,
  UpsertEmployeeLeaveBalanceInput,
} from "../domain/employee-leave-balance.repository";
import type { EmployeeLeaveBalanceEntity } from "../domain/employee-leave-balance.entity";

function toEntity(row: PrismaEmployeeLeaveBalance): EmployeeLeaveBalanceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    year: row.year,
    allocatedDays: row.allocatedDays.toNumber(),
    usedDays: row.usedDays.toNumber(),
    carriedForwardDays: row.carriedForwardDays.toNumber(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaEmployeeLeaveBalanceRepository implements EmployeeLeaveBalanceRepository {
  async findOne(tenantId: string, employeeId: string, leaveTypeId: string, year: number): Promise<EmployeeLeaveBalanceEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employeeLeaveBalance.findUnique({
        where: { tenantId_employeeId_leaveTypeId_year: { tenantId, employeeId, leaveTypeId, year } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByEmployee(tenantId: string, employeeId: string, year: number): Promise<EmployeeLeaveBalanceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.employeeLeaveBalance.findMany({ where: { tenantId, employeeId, year }, orderBy: { createdAt: "asc" } })
    );
    return rows.map(toEntity);
  }

  async upsertAllocation(input: UpsertEmployeeLeaveBalanceInput, tx?: Prisma.TransactionClient): Promise<EmployeeLeaveBalanceEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.employeeLeaveBalance.upsert({
          where: {
            tenantId_employeeId_leaveTypeId_year: {
              tenantId: input.tenantId,
              employeeId: input.employeeId,
              leaveTypeId: input.leaveTypeId,
              year: input.year,
            },
          },
          create: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            leaveTypeId: input.leaveTypeId,
            year: input.year,
            allocatedDays: input.allocatedDays ?? 0,
            carriedForwardDays: input.carriedForwardDays ?? 0,
            createdBy: input.updatedBy ?? null,
            updatedBy: input.updatedBy ?? null,
          },
          update: {
            allocatedDays: input.allocatedDays,
            carriedForwardDays: input.carriedForwardDays,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async adjustUsedDays(
    tenantId: string,
    employeeId: string,
    leaveTypeId: string,
    year: number,
    deltaDays: number,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeLeaveBalanceEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employeeLeaveBalance.upsert({
          where: { tenantId_employeeId_leaveTypeId_year: { tenantId, employeeId, leaveTypeId, year } },
          create: {
            tenantId,
            employeeId,
            leaveTypeId,
            year,
            allocatedDays: 0,
            carriedForwardDays: 0,
            usedDays: Math.max(0, deltaDays),
            createdBy: updatedBy,
            updatedBy,
          },
          update: {
            usedDays: { increment: deltaDays },
            updatedBy,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
