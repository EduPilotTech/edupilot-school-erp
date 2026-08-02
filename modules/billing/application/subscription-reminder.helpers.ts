// Pure, no "server-only" import — deliberately unit-testable in isolation, mirroring
// payment-transition.helpers.ts's / subscription-lifecycle-transition.helpers.ts's own
// "pure logic separated from the server-only service that calls it" pattern.
//
// Phase 16, Bundle D Part Two, Step 1 — the eligibility rules behind the three reminder
// CANDIDATE-DETECTION sweeps (Renewal / Grace / Expiry) and the two lifecycle-transition
// predicates the daily background jobs (Step 3) use to decide PAST_DUE -> EXPIRED and
// EXPIRED -> School Suspension. See subscription-reminder.service.ts's own module comment for why
// these candidate lists are detection-only and do not themselves dispatch a notification.
import type { SubscriptionEntity } from "../domain/subscription.entity";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// A renewal reminder fires this many days before `currentPeriodEnd`.
const RENEWAL_REMINDER_DAYS_BEFORE = 7;

// An ACTIVE subscription that has gone PAST_DUE (past its own `currentPeriodEnd`) gets this many
// days of continued access before Daily Expiry Processing (Step 2/3) would move it to EXPIRED.
const GRACE_PERIOD_DAYS = 7;

// An EXPIRED subscription left unrenewed this long triggers School Suspension.
const SUSPENSION_AFTER_EXPIRY_DAYS = 30;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

// Whole days between two instants, rounded toward zero — used only for the DTO's own
// human-readable `daysRemaining` field (see subscription-reminder.service.ts), never for the
// boundary comparisons below, which all compare raw millisecond instants directly.
export function wholeDaysBetween(from: Date, to: Date): number {
  return Math.trunc((to.getTime() - from.getTime()) / MS_PER_DAY);
}

// Due when: still ACTIVE, still set to auto-renew, and `currentPeriodEnd` is within the next
// RENEWAL_REMINDER_DAYS_BEFORE days (inclusive of both ends: `asOf === currentPeriodEnd` counts,
// and exactly 7 days out counts). Once `asOf` passes `currentPeriodEnd` this returns false — a
// lapsed period is Grace/Expiry's concern, not Renewal's.
export function isRenewalReminderDue(subscription: SubscriptionEntity, asOf: Date): boolean {
  if (subscription.status !== "ACTIVE" || !subscription.autoRenew) {
    return false;
  }
  if (asOf.getTime() > subscription.currentPeriodEnd.getTime()) {
    return false;
  }
  const windowStart = addDays(subscription.currentPeriodEnd, -RENEWAL_REMINDER_DAYS_BEFORE);
  return asOf.getTime() >= windowStart.getTime();
}

// Due for every day the subscription remains PAST_DUE (already in its grace period) — cadence and
// dedup (e.g. "only send once per day") are the CALLER's concern, not this pure predicate's.
export function isGraceReminderDue(subscription: SubscriptionEntity, asOf: Date): boolean {
  void asOf;
  return subscription.status === "PAST_DUE";
}

// A final warning shortly before the grace period runs out: PAST_DUE, and within the last 2 days
// of the (currentPeriodEnd + GRACE_PERIOD_DAYS) boundary, inclusive on both ends.
export function isExpiryReminderDue(subscription: SubscriptionEntity, asOf: Date): boolean {
  if (subscription.status !== "PAST_DUE") {
    return false;
  }
  const graceEnd = addDays(subscription.currentPeriodEnd, GRACE_PERIOD_DAYS);
  const daysUntilGraceEnd = (graceEnd.getTime() - asOf.getTime()) / MS_PER_DAY;
  return daysUntilGraceEnd >= 0 && daysUntilGraceEnd <= 2;
}

// Used by Daily Expiry Processing to decide PAST_DUE -> EXPIRED: the grace period
// (currentPeriodEnd + GRACE_PERIOD_DAYS) has been fully exhausted.
export function isPastGracePeriod(subscription: SubscriptionEntity, asOf: Date): boolean {
  if (subscription.status !== "PAST_DUE") {
    return false;
  }
  const graceEnd = addDays(subscription.currentPeriodEnd, GRACE_PERIOD_DAYS);
  return asOf.getTime() > graceEnd.getTime();
}

// Used by Daily Expiry Processing to decide EXPIRED -> School Suspension. SubscriptionEntity does
// not track "when did this row become EXPIRED" as its own timestamp, so `updatedAt` is used as the
// best available proxy for "when this row's status last changed" — a reasonable approximation, not
// a perfectly precise one, since a status-flip-in-place (updateLifecycleStatus) updates
// `updatedAt` and nothing else on the row touches it after that point.
export function isPastSuspensionThreshold(subscription: SubscriptionEntity, asOf: Date): boolean {
  if (subscription.status !== "EXPIRED") {
    return false;
  }
  const suspensionThreshold = addDays(subscription.updatedAt, SUSPENSION_AFTER_EXPIRY_DAYS);
  return asOf.getTime() > suspensionThreshold.getTime();
}

export { RENEWAL_REMINDER_DAYS_BEFORE, GRACE_PERIOD_DAYS, SUSPENSION_AFTER_EXPIRY_DAYS };
