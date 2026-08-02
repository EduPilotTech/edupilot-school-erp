import "server-only";
import { prisma } from "@/lib/prisma";
import { toEntity } from "../infrastructure/prisma-subscription.repository";
import { moveToExpired, moveToGracePeriod } from "./subscription-lifecycle.service";
import { suspendSchool } from "./school-activation.service";
import { isPastGracePeriod, isPastSuspensionThreshold } from "./subscription-reminder.helpers";
import { sendExpiryReminders, sendGraceReminders, sendRenewalReminders } from "./subscription-reminder.service";
import { processAutoRenewals } from "./auto-renewal.service";
import { SchoolStatusUnchangedError } from "../domain/errors";
import type { DailyExpiryResultDTO, DailyRenewalResultDTO, DailyValidationResultDTO } from "./dto/daily-jobs.dto";
import type { SubscriptionEntity } from "../domain/subscription.entity";
import type { Subscription as PrismaSubscription } from "@/lib/generated/prisma/client";
import type { PlatformBillingContext } from "./billing-context";

// Fixed system-actor markers for mutations triggered by these unattended daily jobs when no human
// actor is present — mirrors payment-processing.service.ts's own WEBHOOK_SYSTEM_ACTOR /
// auto-renewal.service.ts's own AUTO_RENEWAL_SYSTEM_ACTOR precedent for the same reason: no real
// UserProfile row backs these strings, they exist purely so audit/`updatedBy` rows for unattended
// mutations are self-explanatory at a glance.
const DAILY_VALIDATION_SYSTEM_ACTOR = "system:daily-validation-job";
const DAILY_EXPIRY_SYSTEM_ACTOR = "system:daily-expiry-job";

// Platform-wide read, mirrors subscription-reminder.service.ts's own findCurrentSubscriptions —
// every tenant's current (`effectiveTo: null`) subscription row via the plain prisma client, not a
// per-tenant repository loop.
async function findCurrentSubscriptions(): Promise<SubscriptionEntity[]> {
  const rows: PrismaSubscription[] = await prisma.subscription.findMany({ where: { effectiveTo: null } });
  return rows.map(toEntity);
}

// Phase 16, Bundle D Part Two, Step 4 — the three named daily background jobs a future scheduler
// (Phase 21, out of this bundle's scope — no cron infrastructure is wired up here) will invoke
// once per day. Each is a single, self-contained, safe-to-rerun entry point.

// A safety net, not the primary path: a TRIALING subscription past its own `trialEndsAt`, or an
// ACTIVE subscription past its own `currentPeriodEnd`, that the payment-driven paths (Bundle B's
// `subscription.charged` webhook handler, a human-initiated cancellation) never caught. Every
// subscription is swept in its own try/catch — one subscription's failure never stops the sweep
// for every other subscription, same isolation discipline billing-run.service.ts's own comment
// documents.
export async function runDailySubscriptionValidation(
  asOf: Date,
  context: PlatformBillingContext
): Promise<DailyValidationResultDTO> {
  const subscriptions = await findCurrentSubscriptions();
  const actingUserId = context.actingUserId ?? DAILY_VALIDATION_SYSTEM_ACTOR;

  const movedToExpired: string[] = [];
  const movedToGracePeriod: string[] = [];
  const failed: string[] = [];

  for (const subscription of subscriptions) {
    try {
      if (
        subscription.status === "TRIALING" &&
        subscription.trialEndsAt !== null &&
        asOf.getTime() > subscription.trialEndsAt.getTime()
      ) {
        await moveToExpired(subscription.tenantId, subscription.id, { tenantId: subscription.tenantId, actingUserId });
        movedToExpired.push(subscription.tenantId);
        continue;
      }

      if (subscription.status === "ACTIVE" && asOf.getTime() > subscription.currentPeriodEnd.getTime()) {
        await moveToGracePeriod(subscription.tenantId, subscription.id, { tenantId: subscription.tenantId, actingUserId });
        movedToGracePeriod.push(subscription.tenantId);
      }
    } catch {
      failed.push(subscription.tenantId);
    }
  }

  return { validated: subscriptions.length, movedToExpired, movedToGracePeriod, failed };
}

// Two independent sweeps over two disjoint status groups, each in its own per-subscription
// try/catch: (1) PAST_DUE subscriptions whose grace period is fully exhausted -> EXPIRED; (2)
// EXPIRED subscriptions left unrenewed past the suspension threshold -> School Suspension. Grace
// and Expiry reminder dispatch (Step 2) are composed INTO this same job, not exposed as separate
// top-level entry points, per the task brief's own scope grouping ("Renewal Reminder/Grace
// Reminder/Expiry Reminder" sit under "Subscription Automation").
export async function runDailyExpiryProcessing(
  asOf: Date,
  context: PlatformBillingContext
): Promise<DailyExpiryResultDTO> {
  const subscriptions = await findCurrentSubscriptions();
  const actingUserId = context.actingUserId ?? DAILY_EXPIRY_SYSTEM_ACTOR;

  const movedToExpired: string[] = [];
  const failed: string[] = [];

  for (const subscription of subscriptions) {
    if (subscription.status !== "PAST_DUE" || !isPastGracePeriod(subscription, asOf)) {
      continue;
    }
    try {
      await moveToExpired(subscription.tenantId, subscription.id, { tenantId: subscription.tenantId, actingUserId });
      movedToExpired.push(subscription.tenantId);
    } catch {
      failed.push(subscription.tenantId);
    }
  }

  const suspendedTenantIds: string[] = [];

  for (const subscription of subscriptions) {
    if (subscription.status !== "EXPIRED" || !isPastSuspensionThreshold(subscription, asOf)) {
      continue;
    }
    try {
      await suspendSchool(
        subscription.tenantId,
        { reason: "Subscription expired and was not renewed within the grace period." },
        context
      );
      suspendedTenantIds.push(subscription.tenantId);
    } catch (error) {
      // Already-suspended is a no-op, not a failure — a prior run of this same job, or a manual
      // platform-staff suspension, may already have handled this tenant.
      if (error instanceof SchoolStatusUnchangedError) {
        continue;
      }
      failed.push(subscription.tenantId);
    }
  }

  const [graceResult, expiryResult] = await Promise.all([sendGraceReminders(asOf), sendExpiryReminders(asOf)]);

  return {
    movedToExpired,
    suspendedTenantIds,
    graceRemindersSent: graceResult.notifiedTenantIds.length,
    expiryRemindersSent: expiryResult.notifiedTenantIds.length,
    failed,
  };
}

// Reminds tenants approaching renewal FIRST, then actually renews whatever's now due — order
// matters per the task brief: a tenant should hear "renewing soon" before the period is silently
// rolled forward and re-invoiced.
export async function runDailyRenewalProcessing(asOf: Date): Promise<DailyRenewalResultDTO> {
  const renewalReminderResult = await sendRenewalReminders(asOf);
  const autoRenewalResult = await processAutoRenewals(asOf);

  return { renewalRemindersSent: renewalReminderResult.notifiedTenantIds.length, autoRenewalResult };
}
