import "server-only";
import { prisma } from "@/lib/prisma";
import {
  GRACE_PERIOD_DAYS,
  isExpiryReminderDue,
  isGraceReminderDue,
  isRenewalReminderDue,
  wholeDaysBetween,
} from "./subscription-reminder.helpers";
import { notifyTenantAdmins } from "./subscription-notification.helpers";
import { toEntity } from "../infrastructure/prisma-subscription.repository";
import type { ReminderDispatchResultDTO } from "./dto/subscription-reminder.dto";
import type { SubscriptionEntity } from "../domain/subscription.entity";
import type { Subscription as PrismaSubscription } from "@/lib/generated/prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Phase 16, Bundle D Part Two, Step 2 — the platform-wide sweeps that actually DISPATCH a
// Renewal / Grace / Expiry reminder (via notifyTenantAdmins, Step 1), built on top of the pure
// eligibility predicates in subscription-reminder.helpers.ts.
//
// Platform-wide reads: a direct `prisma.subscription.findMany` across every tenant's current
// (`effectiveTo: null`) subscription row, mirroring billing-run.service.ts's own cross-tenant
// precedent — this is a background-job read, not a per-tenant feature-module one, so there is no
// single tenant to scope an `app.tenant_id` RLS context by in the first place.
async function findCurrentSubscriptions(): Promise<SubscriptionEntity[]> {
  const rows: PrismaSubscription[] = await prisma.subscription.findMany({ where: { effectiveTo: null } });
  return rows.map(toEntity);
}

function graceEndOf(subscription: SubscriptionEntity): Date {
  return new Date(subscription.currentPeriodEnd.getTime() + GRACE_PERIOD_DAYS * MS_PER_DAY);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Dispatches one reminder per candidate subscription's own tenant, own try/catch per tenant — same
// per-tenant-isolated-unit-of-work discipline billing-run.service.ts's own comment documents: one
// tenant's notification failure (e.g. no reachable SCHOOL_ADMIN, or a downstream sender error) must
// never stop the sweep for every other tenant.
async function dispatchReminders(
  candidates: SubscriptionEntity[],
  buildCopy: (subscription: SubscriptionEntity) => { title: string; body: string }
): Promise<ReminderDispatchResultDTO> {
  const notifiedTenantIds: string[] = [];
  const failedTenantIds: string[] = [];

  for (const subscription of candidates) {
    try {
      const { title, body } = buildCopy(subscription);
      await notifyTenantAdmins(subscription.tenantId, {
        title,
        body,
        referenceType: "Subscription",
        referenceId: subscription.id,
      });
      notifiedTenantIds.push(subscription.tenantId);
    } catch {
      failedTenantIds.push(subscription.tenantId);
    }
  }

  return { candidateCount: candidates.length, notifiedTenantIds, failedTenantIds };
}

// ACTIVE, autoRenew subscriptions approaching their own `currentPeriodEnd` — reminding a tenant
// BEFORE the period actually lapses (distinct from Grace/Expiry, both of which only fire after a
// period has already lapsed into PAST_DUE).
export async function sendRenewalReminders(asOf: Date): Promise<ReminderDispatchResultDTO> {
  const subscriptions = await findCurrentSubscriptions();
  const candidates = subscriptions.filter((subscription) => isRenewalReminderDue(subscription, asOf));

  return dispatchReminders(candidates, (subscription) => {
    const daysRemaining = wholeDaysBetween(asOf, subscription.currentPeriodEnd);
    return {
      title: "Your subscription renews soon",
      body: `Your ${subscription.plan} plan (${subscription.billingCycle} billing) is set to renew on ${formatDate(
        subscription.currentPeriodEnd
      )} — ${daysRemaining} day(s) remaining. No action is needed if your payment method is up to date.`,
    };
  });
}

// Every PAST_DUE subscription, every day it remains so — a recent payment failed but access
// continues during the grace period.
export async function sendGraceReminders(asOf: Date): Promise<ReminderDispatchResultDTO> {
  const subscriptions = await findCurrentSubscriptions();
  const candidates = subscriptions.filter((subscription) => isGraceReminderDue(subscription, asOf));

  return dispatchReminders(candidates, (subscription) => ({
    title: "Payment past due — your subscription is in a grace period",
    body: `A recent payment for your subscription was unsuccessful. Access continues during your grace period, which ends on ${formatDate(
      graceEndOf(subscription)
    )}. Please clear the outstanding invoice to avoid any interruption to your school's access.`,
  }));
}

// PAST_DUE subscriptions within the final 2 days of their own grace period — a final, urgent
// warning shortly before Daily Expiry Processing would move the subscription to EXPIRED.
export async function sendExpiryReminders(asOf: Date): Promise<ReminderDispatchResultDTO> {
  const subscriptions = await findCurrentSubscriptions();
  const candidates = subscriptions.filter((subscription) => isExpiryReminderDue(subscription, asOf));

  return dispatchReminders(candidates, (subscription) => ({
    title: "Final notice: your subscription will expire soon",
    body: `Your subscription's grace period ends on ${formatDate(
      graceEndOf(subscription)
    )}. Pay the outstanding invoice immediately to avoid your school's access being suspended.`,
  }));
}
