import "server-only";
import { prisma } from "@/lib/prisma";
import {
  GRACE_PERIOD_DAYS,
  isExpiryReminderDue,
  isGraceReminderDue,
  isRenewalReminderDue,
  wholeDaysBetween,
} from "./subscription-reminder.helpers";
import type { ReminderCandidateDTO } from "./dto/subscription-reminder.dto";
import type { SubscriptionEntity } from "../domain/subscription.entity";
import type { Subscription as PrismaSubscription } from "@/lib/generated/prisma/client";
import { toEntity } from "../infrastructure/prisma-subscription.repository";

// Phase 16, Bundle D Part Two, Step 1 — CANDIDATE-DETECTION ONLY. These three functions identify
// which tenants' subscriptions currently need a Renewal / Grace / Expiry reminder and return the
// candidate list; they do NOT dispatch an actual notification.
//
// Why: `dispatchNotification` requires a `NotificationType` value (see modules/communication),
// and every existing value (FEE_DUE, PAYROLL_ALERT, LIBRARY_ALERT, ...) describes a
// school-internal, student/staff-facing concern — none of them fits "EduPilot notifying a School
// about its OWN platform subscription." Reusing a semantically-wrong value (e.g. PAYROLL_ALERT)
// would misrepresent what the notification is about to the person receiving it, so this bundle
// does not do that. Adding a new NotificationType value (e.g. SUBSCRIPTION_ALERT) is a real, if
// small, schema/migration change, which is out of THIS bundle's scope (this bundle touches no
// schema/migration file at all). The actual send-a-notification wiring is therefore a documented
// follow-up, not something silently skipped.
//
// Platform-wide reads: a direct `prisma.subscription.findMany` across every tenant's current
// (`effectiveTo: null`) subscription row, mirroring billing-run.service.ts's own cross-tenant
// precedent of reaching for the plain prisma client directly for a platform-spanning read rather
// than looping tenant-scoped repository calls. This is a background-job read, not a per-tenant
// feature-module one (see CLAUDE.md's own carve-out for background jobs) — there is no single
// tenant to scope an `app.tenant_id` RLS context by in the first place, since the whole point is
// to see every tenant's row at once.
function toReminderCandidate(
  subscription: SubscriptionEntity,
  reminderType: ReminderCandidateDTO["reminderType"],
  boundaryDate: Date,
  asOf: Date
): ReminderCandidateDTO {
  return {
    tenantId: subscription.tenantId,
    subscriptionId: subscription.id,
    reminderType,
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString().slice(0, 10),
    daysRemaining: wholeDaysBetween(asOf, boundaryDate),
  };
}

async function findCurrentSubscriptions(): Promise<SubscriptionEntity[]> {
  const rows: PrismaSubscription[] = await prisma.subscription.findMany({ where: { effectiveTo: null } });
  return rows.map(toEntity);
}

function graceBoundary(subscription: SubscriptionEntity): Date {
  return new Date(subscription.currentPeriodEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
}

export async function getRenewalReminderCandidates(asOf: Date): Promise<ReminderCandidateDTO[]> {
  const subscriptions = await findCurrentSubscriptions();
  return subscriptions
    .filter((subscription) => isRenewalReminderDue(subscription, asOf))
    .map((subscription) => toReminderCandidate(subscription, "RENEWAL", subscription.currentPeriodEnd, asOf));
}

export async function getGraceReminderCandidates(asOf: Date): Promise<ReminderCandidateDTO[]> {
  const subscriptions = await findCurrentSubscriptions();
  return subscriptions
    .filter((subscription) => isGraceReminderDue(subscription, asOf))
    .map((subscription) => toReminderCandidate(subscription, "GRACE", graceBoundary(subscription), asOf));
}

export async function getExpiryReminderCandidates(asOf: Date): Promise<ReminderCandidateDTO[]> {
  const subscriptions = await findCurrentSubscriptions();
  return subscriptions
    .filter((subscription) => isExpiryReminderDue(subscription, asOf))
    .map((subscription) => toReminderCandidate(subscription, "EXPIRY", graceBoundary(subscription), asOf));
}
