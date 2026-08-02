import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, PlatformInvoiceSequence as PrismaPlatformInvoiceSequence } from "@/lib/generated/prisma/client";
import type { PlatformInvoiceSequenceRepository } from "../domain/platform-invoice-sequence.repository";
import type { PlatformInvoiceSequenceEntity } from "../domain/platform-invoice-sequence.entity";

const SEQUENCE_PAD_LENGTH = 6;

// Mirrors prisma-fee-number-sequence.repository.ts exactly, minus the tenantId/type dimensions —
// scoped only by financial year, direct `prisma` client (platform-ops tier, no RLS tenant context
// to set).
export function toEntity(row: PrismaPlatformInvoiceSequence): PlatformInvoiceSequenceEntity {
  return {
    id: row.id,
    financialYear: row.financialYear,
    prefix: row.prefix,
    lastNumber: row.lastNumber,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

export class PrismaPlatformInvoiceSequenceRepository implements PlatformInvoiceSequenceRepository {
  async findByFinancialYear(financialYear: string): Promise<PlatformInvoiceSequenceEntity | null> {
    const row = await prisma.platformInvoiceSequence.findUnique({ where: { financialYear } });
    return row ? toEntity(row) : null;
  }

  async nextNumber(financialYear: string, tx: Prisma.TransactionClient): Promise<string> {
    const row = await tx.platformInvoiceSequence.upsert({
      where: { financialYear },
      create: { financialYear, prefix: "", lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    return `${row.prefix}${String(row.lastNumber).padStart(SEQUENCE_PAD_LENGTH, "0")}`;
  }

  async configurePrefix(
    financialYear: string,
    prefix: string,
    updatedBy: string | null
  ): Promise<PlatformInvoiceSequenceEntity> {
    const row = await prisma.platformInvoiceSequence.upsert({
      where: { financialYear },
      create: { financialYear, prefix, lastNumber: 0, updatedBy },
      update: { prefix, updatedBy },
    });
    return toEntity(row);
  }
}
