import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Payslip as PrismaPayslip } from "@/lib/generated/prisma/client";
import type { CreatePayslipInput, PayslipListFilter, PayslipRepository, UpdatePayslipInput } from "../domain/payroll-run.repository";
import type { PayslipEntity, PayslipStatusValue } from "../domain/payroll-run.entity";

function toEntity(row: PrismaPayslip): PayslipEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    payrollRunId: row.payrollRunId,
    employeeId: row.employeeId,
    billingPeriod: row.billingPeriod,
    basicSalary: row.basicSalary.toNumber(),
    grossEarnings: row.grossEarnings.toNumber(),
    totalDeductions: row.totalDeductions.toNumber(),
    loanRecoveryAmount: row.loanRecoveryAmount.toNumber(),
    netPay: row.netPay.toNumber(),
    status: row.status as PayslipStatusValue,
    generatedAt: row.generatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaPayslipRepository implements PayslipRepository {
  async findById(tenantId: string, id: string): Promise<PayslipEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.payslip.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByEmployeeAndRun(tenantId: string, employeeId: string, payrollRunId: string): Promise<PayslipEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.payslip.findUnique({
        where: { tenantId_employeeId_payrollRunId: { tenantId, employeeId, payrollRunId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: PayslipListFilter): Promise<PayslipEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.payslip.findMany({
        where: {
          tenantId,
          employeeId: filter.employeeId,
          payrollRunId: filter.payrollRunId,
          billingPeriod: filter.billingPeriod,
        },
        orderBy: { billingPeriod: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByRun(tenantId: string, payrollRunId: string): Promise<PayslipEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.payslip.findMany({ where: { tenantId, payrollRunId } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreatePayslipInput, tx?: Prisma.TransactionClient): Promise<PayslipEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.payslip.create({
          data: {
            tenantId: input.tenantId,
            payrollRunId: input.payrollRunId,
            employeeId: input.employeeId,
            billingPeriod: input.billingPeriod,
            basicSalary: input.basicSalary,
            grossEarnings: input.grossEarnings,
            totalDeductions: input.totalDeductions,
            loanRecoveryAmount: input.loanRecoveryAmount,
            netPay: input.netPay,
            status: input.status ?? "GENERATED",
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdatePayslipInput, tx?: Prisma.TransactionClient): Promise<PayslipEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.payslip.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            basicSalary: input.basicSalary,
            grossEarnings: input.grossEarnings,
            totalDeductions: input.totalDeductions,
            loanRecoveryAmount: input.loanRecoveryAmount,
            netPay: input.netPay,
            status: input.status,
            generatedAt: new Date(),
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: PayslipStatusValue,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<PayslipEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.payslip.update({
          where: { tenantId_id: { tenantId, id } },
          data: { status, updatedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
