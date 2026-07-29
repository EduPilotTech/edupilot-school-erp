import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, FeeNumberSequence as PrismaFeeNumberSequence } from "@/lib/generated/prisma/client";
import type { FeeNumberSequenceRepository } from "../domain/fee-number-sequence.repository";
import type { FeeNumberSequenceEntity, FeeNumberSequenceTypeValue } from "../domain/fee-number-sequence.entity";

const SEQUENCE_PAD_LENGTH = 6;

function toEntity(row: PrismaFeeNumberSequence): FeeNumberSequenceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    type: row.type as FeeNumberSequenceTypeValue,
    prefix: row.prefix,
    lastNumber: row.lastNumber,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

export class PrismaFeeNumberSequenceRepository implements FeeNumberSequenceRepository {
  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<FeeNumberSequenceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeNumberSequence.findMany({ where: { tenantId, academicSessionId } })
    );
    return rows.map(toEntity);
  }

  async nextNumber(
    tenantId: string,
    academicSessionId: string,
    type: FeeNumberSequenceTypeValue,
    tx: Prisma.TransactionClient
  ): Promise<string> {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const row = await tx.feeNumberSequence.upsert({
      where: { tenantId_academicSessionId_type: { tenantId, academicSessionId, type } },
      create: { tenantId, academicSessionId, type, prefix: "", lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    return `${row.prefix}${String(row.lastNumber).padStart(SEQUENCE_PAD_LENGTH, "0")}`;
  }

  async configurePrefix(
    tenantId: string,
    academicSessionId: string,
    type: FeeNumberSequenceTypeValue,
    prefix: string,
    updatedBy: string | null
  ): Promise<FeeNumberSequenceEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeNumberSequence.upsert({
        where: { tenantId_academicSessionId_type: { tenantId, academicSessionId, type } },
        create: { tenantId, academicSessionId, type, prefix, lastNumber: 0, updatedBy },
        update: { prefix, updatedBy },
      })
    );
    return toEntity(row);
  }
}
