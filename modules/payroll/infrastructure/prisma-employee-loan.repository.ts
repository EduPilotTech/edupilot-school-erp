import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, EmployeeLoan as PrismaEmployeeLoan } from "@/lib/generated/prisma/client";
import type { CreateEmployeeLoanInput, EmployeeLoanRepository } from "../domain/employee-loan.repository";
import type { EmployeeLoanEntity, EmployeeLoanStatusValue, EmployeeLoanTypeValue } from "../domain/employee-loan.entity";

function toEntity(row: PrismaEmployeeLoan): EmployeeLoanEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    loanType: row.loanType as EmployeeLoanTypeValue,
    principalAmount: row.principalAmount.toNumber(),
    monthlyRecoveryAmount: row.monthlyRecoveryAmount.toNumber(),
    outstandingAmount: row.outstandingAmount.toNumber(),
    startDate: row.startDate,
    status: row.status as EmployeeLoanStatusValue,
    reason: row.reason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaEmployeeLoanRepository implements EmployeeLoanRepository {
  async findById(tenantId: string, id: string): Promise<EmployeeLoanEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employeeLoan.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByEmployee(tenantId: string, employeeId: string, status?: EmployeeLoanStatusValue): Promise<EmployeeLoanEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.employeeLoan.findMany({
        where: { tenantId, employeeId, status },
        orderBy: { createdAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findActiveByEmployee(tenantId: string, employeeId: string, tx?: Prisma.TransactionClient): Promise<EmployeeLoanEntity[]> {
    const rows = await withTenantContext(
      tenantId,
      (client) =>
        client.employeeLoan.findMany({
          where: { tenantId, employeeId, status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
        }),
      tx
    );
    return rows.map(toEntity);
  }

  async create(input: CreateEmployeeLoanInput, tx?: Prisma.TransactionClient): Promise<EmployeeLoanEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.employeeLoan.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            loanType: input.loanType,
            principalAmount: input.principalAmount,
            monthlyRecoveryAmount: input.monthlyRecoveryAmount,
            outstandingAmount: input.principalAmount,
            startDate: input.startDate,
            reason: input.reason ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async recordRecovery(
    tenantId: string,
    id: string,
    newOutstandingAmount: number,
    newStatus: EmployeeLoanStatusValue,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeLoanEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employeeLoan.update({
          where: { tenantId_id: { tenantId, id } },
          data: { outstandingAmount: newOutstandingAmount, status: newStatus },
        }),
      tx
    );
    return toEntity(row);
  }

  async cancel(tenantId: string, id: string, updatedBy: string | null, tx?: Prisma.TransactionClient): Promise<EmployeeLoanEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employeeLoan.update({
          where: { tenantId_id: { tenantId, id } },
          data: { status: "CANCELLED", updatedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
