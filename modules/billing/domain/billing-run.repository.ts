import type { Prisma } from "@/lib/generated/prisma/client";
import type { BillingRunEntity } from "./billing-run.entity";

export interface CreateBillingRunInput {
  billingPeriod: string;
  createdBy?: string | null;
}

export interface MarkBillingRunProcessedInput {
  processedBy: string | null;
}

export interface IncrementBillingRunTotalsInput {
  invoicesGenerated: number;
  amountBilled: number;
}

// Platform-ops tier — no tenantId on any method (see the module-level brief).
export interface BillingRunRepository {
  findById(id: string): Promise<BillingRunEntity | null>;
  findByBillingPeriod(billingPeriod: string): Promise<BillingRunEntity | null>;
  findAll(): Promise<BillingRunEntity[]>;

  create(input: CreateBillingRunInput, tx?: Prisma.TransactionClient): Promise<BillingRunEntity>;

  markProcessed(id: string, input: MarkBillingRunProcessedInput, tx?: Prisma.TransactionClient): Promise<BillingRunEntity>;

  markLocked(id: string, lockedBy: string | null, tx?: Prisma.TransactionClient): Promise<BillingRunEntity>;

  // Atomically increments the run's own aggregate totals — used once per tenant during
  // processBillingRun's fan-out (see billing-run.service.ts's own comment for why this is a
  // per-tenant atomic increment rather than a single all-or-nothing recompute: BillingRun spans
  // every tenant on the platform, so one tenant's invoice-generation failure must never roll back
  // every other tenant's already-generated invoice or its contribution to these totals).
  incrementTotals(id: string, input: IncrementBillingRunTotalsInput, tx?: Prisma.TransactionClient): Promise<BillingRunEntity>;
}
