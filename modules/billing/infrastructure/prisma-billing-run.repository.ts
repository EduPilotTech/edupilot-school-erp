import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, BillingRun as PrismaBillingRun } from "@/lib/generated/prisma/client";
import type {
  BillingRunRepository,
  CreateBillingRunInput,
  IncrementBillingRunTotalsInput,
  MarkBillingRunProcessedInput,
} from "../domain/billing-run.repository";
import type { BillingRunEntity, BillingRunStatusValue } from "../domain/billing-run.entity";

// Platform-ops tier — direct `prisma` client (see prisma-subscription-plan-definition.repository.ts's
// own note); `tx`, when passed, joins the caller's already-open transaction instead of using the
// bare client.
export function toEntity(row: PrismaBillingRun): BillingRunEntity {
  return {
    id: row.id,
    billingPeriod: row.billingPeriod,
    status: row.status as BillingRunStatusValue,
    processedAt: row.processedAt,
    processedBy: row.processedBy,
    lockedAt: row.lockedAt,
    lockedBy: row.lockedBy,
    totalInvoicesGenerated: row.totalInvoicesGenerated,
    totalAmountBilled: row.totalAmountBilled.toNumber(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaBillingRunRepository implements BillingRunRepository {
  async findById(id: string): Promise<BillingRunEntity | null> {
    const row = await prisma.billingRun.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByBillingPeriod(billingPeriod: string): Promise<BillingRunEntity | null> {
    const row = await prisma.billingRun.findUnique({ where: { billingPeriod } });
    return row ? toEntity(row) : null;
  }

  async findAll(): Promise<BillingRunEntity[]> {
    const rows = await prisma.billingRun.findMany({ orderBy: { billingPeriod: "desc" } });
    return rows.map(toEntity);
  }

  async create(input: CreateBillingRunInput, tx?: Prisma.TransactionClient): Promise<BillingRunEntity> {
    const client = tx ?? prisma;
    const row = await client.billingRun.create({
      data: {
        billingPeriod: input.billingPeriod,
        createdBy: input.createdBy ?? null,
        updatedBy: input.createdBy ?? null,
      },
    });
    return toEntity(row);
  }

  async markProcessed(
    id: string,
    input: MarkBillingRunProcessedInput,
    tx?: Prisma.TransactionClient
  ): Promise<BillingRunEntity> {
    const client = tx ?? prisma;
    const row = await client.billingRun.update({
      where: { id },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
        processedBy: input.processedBy,
        updatedBy: input.processedBy,
      },
    });
    return toEntity(row);
  }

  async markLocked(id: string, lockedBy: string | null, tx?: Prisma.TransactionClient): Promise<BillingRunEntity> {
    const client = tx ?? prisma;
    const row = await client.billingRun.update({
      where: { id },
      data: { status: "LOCKED", lockedAt: new Date(), lockedBy, updatedBy: lockedBy },
    });
    return toEntity(row);
  }

  async incrementTotals(
    id: string,
    input: IncrementBillingRunTotalsInput,
    tx?: Prisma.TransactionClient
  ): Promise<BillingRunEntity> {
    const client = tx ?? prisma;
    const row = await client.billingRun.update({
      where: { id },
      data: {
        totalInvoicesGenerated: { increment: input.invoicesGenerated },
        totalAmountBilled: { increment: input.amountBilled },
      },
    });
    return toEntity(row);
  }
}
