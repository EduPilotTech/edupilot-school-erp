import "server-only";
import { prisma } from "@/lib/prisma";
import { createSubscription } from "./subscription.service";
import { generateSubscriptionInvoice } from "./generate-subscription-invoice.service";
import { toEntity } from "../infrastructure/prisma-subscription.repository";
import type { AutoRenewalResultDTO } from "./dto/auto-renewal.dto";
import type { SubscriptionEntity } from "../domain/subscription.entity";
import type { Subscription as PrismaSubscription } from "@/lib/generated/prisma/client";

const MONTHS_PER_ANNUAL_CYCLE = 12;

// Fixed system-actor marker for mutations triggered by this unattended daily job — mirrors
// payment-processing.service.ts's own WEBHOOK_SYSTEM_ACTOR precedent for the same reason: no real
// UserProfile row backs this string, it exists purely so audit/`updatedBy` rows for this job's
// mutations are self-explanatory at a glance rather than a bare null.
const AUTO_RENEWAL_SYSTEM_ACTOR = "system:daily-renewal-job";

// Mirrors subscription.service.ts's own private `addMonths` helper exactly (that function is not
// exported from its file, so this is a deliberate, documented duplication rather than an import of
// a private implementation detail) — plain calendar-month arithmetic, no fixed 30-day assumption.
function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

// The calendar-month key ("YYYY-MM") a UTC date falls in — mirrors billing-run.service.ts's own
// `yearMonthOf` helper (also private to its file).
function yearMonthOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Phase 16, Bundle D Part Two, Step 2.
//
// HONEST LIMITATION (documented per the task brief, restated in the final report too): this
// schema has no stored, reusable payment-method token/mandate — no Razorpay recurring-Subscriptions
// object, no saved-card/UPI-Autopay reference. "Auto renewal" here means automatically extending
// the subscription's own billing period and generating the next invoice for it, NOT automatically
// charging a card with zero human/gateway interaction. Actual payment collection for that new
// invoice still depends on the tenant paying it (manually, or via whatever checkout flow a future
// UI bundle builds) or a future webhook-driven charge if a recurring-payment mechanism is added
// later.
//
// Sweeps every current, ACTIVE, autoRenew subscription whose `currentPeriodEnd` has already
// passed (`<= asOf`) — the period has actually ended, distinct from Step 1's reminder, which fires
// BEFORE the period ends. Platform-wide read via a direct `prisma.subscription.findMany`, same
// background-job precedent as subscription-reminder.service.ts's own module comment explains.
//
// Each subscription's renewal runs in its OWN try/catch: one tenant's failure must never stop the
// sweep, same per-tenant-isolated-unit-of-work discipline billing-run.service.ts's own comment
// documents for exactly this reason.
export async function processAutoRenewals(asOf: Date): Promise<AutoRenewalResultDTO> {
  const rows: PrismaSubscription[] = await prisma.subscription.findMany({
    where: { effectiveTo: null, status: "ACTIVE", autoRenew: true, currentPeriodEnd: { lte: asOf } },
  });
  const dueSubscriptions: SubscriptionEntity[] = rows.map(toEntity);

  const renewedTenantIds: string[] = [];
  const failedTenantIds: string[] = [];

  for (const subscription of dueSubscriptions) {
    try {
      const effectiveFrom = subscription.currentPeriodEnd;
      const monthsToAdd = subscription.billingCycle === "MONTHLY" ? 1 : MONTHS_PER_ANNUAL_CYCLE;
      const newCurrentPeriodEnd = addMonths(effectiveFrom, monthsToAdd);

      // Reuses the already-frozen close-then-create revision logic directly — exactly mirrors
      // payment-processing.service.ts's own `subscription.charged` handler's reasoning for
      // renewing a subscription's period via createSubscription rather than any new
      // repository code.
      const renewed = await createSubscription(
        {
          subscriptionPlanDefinitionId: subscription.subscriptionPlanDefinitionId,
          billingCycle: subscription.billingCycle,
          effectiveFrom,
          autoRenew: subscription.autoRenew,
        },
        { tenantId: subscription.tenantId, actingUserId: AUTO_RENEWAL_SYSTEM_ACTOR }
      );

      await generateSubscriptionInvoice({
        tenantId: subscription.tenantId,
        subscriptionId: renewed.id,
        billingRunId: null,
        billingPeriod: yearMonthOf(effectiveFrom),
        periodStart: effectiveFrom,
        periodEnd: newCurrentPeriodEnd,
        dueDate: effectiveFrom,
        actingUserId: AUTO_RENEWAL_SYSTEM_ACTOR,
      });

      renewedTenantIds.push(subscription.tenantId);
    } catch {
      failedTenantIds.push(subscription.tenantId);
    }
  }

  return { processed: dueSubscriptions.length, renewedTenantIds, failedTenantIds };
}
