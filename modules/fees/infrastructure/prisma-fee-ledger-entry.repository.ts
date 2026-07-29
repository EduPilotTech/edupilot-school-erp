import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, FeeLedgerEntry as PrismaFeeLedgerEntry } from "@/lib/generated/prisma/client";
import type { CreateFeeLedgerEntryInput, FeeLedgerEntryRepository } from "../domain/fee-ledger-entry.repository";
import type { FeeLedgerEntryEntity, FeeLedgerEntryTypeValue } from "../domain/fee-ledger-entry.entity";

function toEntity(row: PrismaFeeLedgerEntry): FeeLedgerEntryEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    entryType: row.entryType as FeeLedgerEntryTypeValue,
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

export class PrismaFeeLedgerEntryRepository implements FeeLedgerEntryRepository {
  async findByStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<FeeLedgerEntryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeLedgerEntry.findMany({
        where: { tenantId, studentId, academicSessionId },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async getLatestBalance(
    tenantId: string,
    studentId: string,
    academicSessionId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.feeLedgerEntry.findFirst({
          where: { tenantId, studentId, academicSessionId },
          orderBy: { createdAt: "desc" },
        }),
      tx
    );
    return row ? row.balanceAfter.toNumber() : 0;
  }

  async create(input: CreateFeeLedgerEntryInput, tx?: Prisma.TransactionClient): Promise<FeeLedgerEntryEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.feeLedgerEntry.create({
          data: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            academicSessionId: input.academicSessionId,
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
