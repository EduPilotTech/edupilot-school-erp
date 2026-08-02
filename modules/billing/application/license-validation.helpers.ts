// Pure, no "server-only" import — deliberately unit-testable in isolation.
import type { SubscriptionEntity, SubscriptionStatusValue } from "../domain/subscription.entity";

export interface LicenseValidationResult {
  valid: boolean;
  status: SubscriptionStatusValue | "NO_SUBSCRIPTION";
  reason: string | null;
}

// The coarse "is this tenant allowed into the application at all" check — distinct from
// per-feature entitlement resolution (feature-entitlement-resolution.helpers.ts), which gates
// individual features once a tenant is already let in.
//
// Judgment calls, made explicit here rather than guessed at silently:
// - CANCELED / EXPIRED -> always invalid, no grace period.
// - PAST_DUE -> still VALID (a grace period: payment failed but access isn't cut immediately —
//   the common SaaS pattern of dunning before hard-locking a tenant out), but with a non-null
//   `reason` so a caller can surface a warning banner.
// - TRIALING -> valid unless `trialEndsAt` has already passed (a stale row a background
//   expiry job hasn't caught up to yet still correctly reports invalid here).
// - ACTIVE -> valid unless `currentPeriodEnd` has already passed and the subscription was not
//   renewed (again, covers a stale row ahead of whatever expiry job would normally flip its
//   status).
export function evaluateLicenseValidity(subscription: SubscriptionEntity | null, asOf: Date): LicenseValidationResult {
  if (!subscription) {
    return { valid: false, status: "NO_SUBSCRIPTION", reason: "No subscription found for this tenant." };
  }

  if (subscription.status === "CANCELED") {
    return { valid: false, status: "CANCELED", reason: "This subscription has been cancelled." };
  }

  if (subscription.status === "EXPIRED") {
    return { valid: false, status: "EXPIRED", reason: "This subscription has expired." };
  }

  if (subscription.status === "PAST_DUE") {
    return { valid: true, status: "PAST_DUE", reason: "Payment is past due — access continues during the grace period." };
  }

  if (subscription.status === "TRIALING") {
    if (subscription.trialEndsAt && subscription.trialEndsAt.getTime() < asOf.getTime()) {
      return { valid: false, status: "TRIALING", reason: "The trial period has ended." };
    }
    return { valid: true, status: "TRIALING", reason: null };
  }

  // ACTIVE
  if (subscription.currentPeriodEnd.getTime() < asOf.getTime()) {
    return { valid: false, status: "ACTIVE", reason: "The subscription period has ended and has not been renewed." };
  }
  return { valid: true, status: "ACTIVE", reason: null };
}
