import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionRepository } from "../infrastructure/prisma-subscription.repository";
import { PrismaBillingRunRepository } from "../infrastructure/prisma-billing-run.repository";
import { BillingRunAlreadyExistsError, BillingRunLockedError, BillingRunNotDraftError, BillingRunNotFoundError, BillingRunNotProcessedError, SubscriptionInvoiceAlreadyExistsError } from "../domain/errors";
import { recordPlatformAudit } from "./billing-audit.helpers";
import { generateSubscriptionInvoice } from "./generate-subscription-invoice.service";
import { createBillingRunSchema, type BillingRunDTO, type ProcessBillingRunResultDTO } from "./dto/billing-run.dto";
import type { BillingRunEntity } from "../domain/billing-run.entity";
import type { SubscriptionEntity } from "../domain/subscription.entity";
import type { PlatformBillingContext } from "./billing-context";

// Tenants at or above this count would need pagination for a single billing run's fan-out — no
// tenant list of this size is expected in practice, mirrors payroll-run.service.ts's own
// MAX_EMPLOYEES_PER_SCHOOL "single page is enough" precedent.
const MAX_TENANTS_PER_RUN = 100000;

function toDTO(entity: BillingRunEntity): BillingRunDTO {
  return {
    id: entity.id,
    billingPeriod: entity.billingPeriod,
    status: entity.status,
    processedAt: entity.processedAt ? entity.processedAt.toISOString() : null,
    lockedAt: entity.lockedAt ? entity.lockedAt.toISOString() : null,
    totalInvoicesGenerated: entity.totalInvoicesGenerated,
    totalAmountBilled: entity.totalAmountBilled,
  };
}

// The calendar-month key ("YYYY-MM") a UTC date falls in — used to decide whether a given
// subscription's own current period starts inside the billing run's billingPeriod.
function yearMonthOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

const subscriptionRepository = new PrismaSubscriptionRepository();
const billingRunRepository = new PrismaBillingRunRepository();

export async function createBillingRun(input: unknown, context: PlatformBillingContext): Promise<BillingRunDTO> {
  const parsed = createBillingRunSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid billing run data.");
  }
  const data = parsed.data;
  const { actingUserId } = context;

  const existing = await billingRunRepository.findByBillingPeriod(data.billingPeriod);
  if (existing) {
    throw new BillingRunAlreadyExistsError();
  }

  try {
    const run = await billingRunRepository.create({ billingPeriod: data.billingPeriod, createdBy: actingUserId });

    await recordPlatformAudit({
      actorId: actingUserId,
      action: "BILLING_RUN_CREATED",
      entityType: "BillingRun",
      entityId: run.id,
      afterState: run,
    });

    return toDTO(run);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BillingRunAlreadyExistsError();
    }
    throw error;
  }
}

// THE generation engine — spans every tenant on the platform, so (unlike
// payroll-run.service.ts's processPayrollRun, which runs entirely inside one transaction) each
// tenant's invoice is generated in its OWN transaction: one tenant's failure is caught, recorded
// as skipped, and never rolls back any other tenant's already-generated invoice or its own
// contribution to the run's aggregate totals (see BillingRunRepository.incrementTotals's own
// comment for why this must be a per-tenant atomic increment, not a single all-or-nothing
// recompute at the end).
//
// Candidate selection: a tenant is billed in this run only if its current subscription's own
// `currentPeriodStart` falls in the calendar month this run's `billingPeriod` names — i.e. this
// run invoices every subscription whose period is starting this month, using that subscription's
// own stored period boundaries (never rolling the period forward itself; there is no repository
// method to advance `currentPeriodStart`/`currentPeriodEnd` — that remains a renewal concern
// outside this bundle's scope). CANCELED/EXPIRED subscriptions are never billed.
export async function processBillingRun(billingRunId: string, context: PlatformBillingContext): Promise<ProcessBillingRunResultDTO> {
  const { actingUserId } = context;

  const run = await billingRunRepository.findById(billingRunId);
  if (!run) throw new BillingRunNotFoundError();
  if (run.status !== "DRAFT") throw new BillingRunNotDraftError();

  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true },
    take: MAX_TENANTS_PER_RUN,
  });

  const skippedTenantIds: string[] = [];
  let invoicesGenerated = 0;

  for (const tenant of tenants) {
    let subscription: SubscriptionEntity | null;
    try {
      subscription = await subscriptionRepository.findCurrentForTenant(tenant.id);
    } catch {
      skippedTenantIds.push(tenant.id);
      continue;
    }

    if (!subscription || subscription.status === "CANCELED" || subscription.status === "EXPIRED") {
      continue;
    }
    if (yearMonthOf(subscription.currentPeriodStart) !== run.billingPeriod) {
      continue;
    }

    try {
      const invoice = await generateSubscriptionInvoice({
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        billingRunId: run.id,
        billingPeriod: run.billingPeriod,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        dueDate: subscription.currentPeriodStart,
        actingUserId,
      });

      await billingRunRepository.incrementTotals(run.id, {
        invoicesGenerated: 1,
        amountBilled: invoice.totalAmount,
      });
      invoicesGenerated += 1;
    } catch (error) {
      // A duplicate (already invoiced this period, e.g. a re-run) is a silent skip, not a
      // failure — every other unexpected error is still recorded as skipped rather than aborting
      // the rest of the run.
      if (!(error instanceof SubscriptionInvoiceAlreadyExistsError)) {
        skippedTenantIds.push(tenant.id);
      }
    }
  }

  const processed = await billingRunRepository.markProcessed(run.id, { processedBy: actingUserId });

  await recordPlatformAudit({
    actorId: actingUserId,
    action: "BILLING_RUN_PROCESSED",
    entityType: "BillingRun",
    entityId: processed.id,
    beforeState: run,
    afterState: { invoicesGenerated, skippedTenantIds },
  });

  return { billingRun: toDTO(processed), invoicesGenerated, skippedTenantIds };
}

export async function lockBillingRun(billingRunId: string, context: PlatformBillingContext): Promise<BillingRunDTO> {
  const { actingUserId } = context;

  const run = await billingRunRepository.findById(billingRunId);
  if (!run) throw new BillingRunNotFoundError();
  if (run.status === "LOCKED") throw new BillingRunLockedError();
  if (run.status !== "PROCESSED") throw new BillingRunNotProcessedError();

  const locked = await billingRunRepository.markLocked(run.id, actingUserId);

  await recordPlatformAudit({
    actorId: actingUserId,
    action: "BILLING_RUN_LOCKED",
    entityType: "BillingRun",
    entityId: locked.id,
    beforeState: run,
    afterState: locked,
  });

  return toDTO(locked);
}

export async function getBillingRun(id: string): Promise<BillingRunDTO | null> {
  const run = await billingRunRepository.findById(id);
  return run ? toDTO(run) : null;
}

export async function listBillingRuns(): Promise<BillingRunDTO[]> {
  const runs = await billingRunRepository.findAll();
  return runs.map(toDTO);
}

export { toDTO as toBillingRunDTO };
