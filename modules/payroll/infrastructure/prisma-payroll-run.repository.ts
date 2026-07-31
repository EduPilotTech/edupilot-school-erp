import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, PayrollRun as PrismaPayrollRun } from "@/lib/generated/prisma/client";
import type {
  CreatePayrollRunInput,
  PayrollRunRepository,
  ProcessPayrollRunInput,
} from "../domain/payroll-run.repository";
import type { PayrollRunEntity, PayrollRunStatusValue } from "../domain/payroll-run.entity";

function toEntity(row: PrismaPayrollRun): PayrollRunEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    billingPeriod: row.billingPeriod,
    status: row.status as PayrollRunStatusValue,
    processedAt: row.processedAt,
    processedBy: row.processedBy,
    lockedAt: row.lockedAt,
    lockedBy: row.lockedBy,
    totalGross: row.totalGross.toNumber(),
    totalDeductions: row.totalDeductions.toNumber(),
    totalNetPay: row.totalNetPay.toNumber(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaPayrollRunRepository implements PayrollRunRepository {
  async findById(tenantId: string, id: string): Promise<PayrollRunEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.payrollRun.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findBySchoolAndPeriod(tenantId: string, schoolId: string, billingPeriod: string): Promise<PayrollRunEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.payrollRun.findUnique({
        where: { tenantId_schoolId_billingPeriod: { tenantId, schoolId, billingPeriod } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findBySchool(tenantId: string, schoolId?: string): Promise<PayrollRunEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.payrollRun.findMany({
        where: { tenantId, schoolId },
        orderBy: { billingPeriod: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreatePayrollRunInput, tx?: Prisma.TransactionClient): Promise<PayrollRunEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.payrollRun.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            billingPeriod: input.billingPeriod,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async markProcessed(
    tenantId: string,
    id: string,
    input: ProcessPayrollRunInput,
    tx?: Prisma.TransactionClient
  ): Promise<PayrollRunEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.payrollRun.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: "PROCESSED",
            processedAt: new Date(),
            processedBy: input.processedBy,
            totalGross: input.totalGross,
            totalDeductions: input.totalDeductions,
            totalNetPay: input.totalNetPay,
            updatedBy: input.processedBy,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async markLocked(tenantId: string, id: string, lockedBy: string | null, tx?: Prisma.TransactionClient): Promise<PayrollRunEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.payrollRun.update({
          where: { tenantId_id: { tenantId, id } },
          data: { status: "LOCKED", lockedAt: new Date(), lockedBy, updatedBy: lockedBy },
        }),
      tx
    );
    return toEntity(row);
  }

  async adjustTotals(
    tenantId: string,
    id: string,
    delta: { deltaGross: number; deltaDeductions: number; deltaNetPay: number },
    tx?: Prisma.TransactionClient
  ): Promise<PayrollRunEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.payrollRun.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            totalGross: { increment: delta.deltaGross },
            totalDeductions: { increment: delta.deltaDeductions },
            totalNetPay: { increment: delta.deltaNetPay },
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
