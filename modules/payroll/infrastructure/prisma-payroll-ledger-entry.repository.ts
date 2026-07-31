import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, PayrollLedgerEntry as PrismaPayrollLedgerEntry } from "@/lib/generated/prisma/client";
import type { CreatePayrollLedgerEntryInput, PayrollLedgerEntryRepository } from "../domain/payroll-ledger-entry.repository";
import type { PayrollLedgerEntryEntity, PayrollLedgerEntryTypeValue } from "../domain/payroll-ledger-entry.entity";

function toEntity(row: PrismaPayrollLedgerEntry): PayrollLedgerEntryEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    entryType: row.entryType as PayrollLedgerEntryTypeValue,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    debit: row.debit.toNumber(),
    credit: row.credit.toNumber(),
    balanceAfter: row.balanceAfter.toNumber(),
    description: row.description,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export class PrismaPayrollLedgerEntryRepository implements PayrollLedgerEntryRepository {
  async findByEmployee(tenantId: string, employeeId: string): Promise<PayrollLedgerEntryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.payrollLedgerEntry.findMany({ where: { tenantId, employeeId }, orderBy: { createdAt: "asc" } })
    );
    return rows.map(toEntity);
  }

  async getLatestBalance(tenantId: string, employeeId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.payrollLedgerEntry.findFirst({
          where: { tenantId, employeeId },
          orderBy: { createdAt: "desc" },
        }),
      tx
    );
    return row ? row.balanceAfter.toNumber() : 0;
  }

  async create(input: CreatePayrollLedgerEntryInput, tx?: Prisma.TransactionClient): Promise<PayrollLedgerEntryEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.payrollLedgerEntry.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            entryType: input.entryType,
            referenceType: input.referenceType,
            referenceId: input.referenceId,
            debit: input.debit ?? 0,
            credit: input.credit ?? 0,
            balanceAfter: input.balanceAfter,
            description: input.description,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
