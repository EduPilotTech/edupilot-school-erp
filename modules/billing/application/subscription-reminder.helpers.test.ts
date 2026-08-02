import { describe, expect, it } from "vitest";
import {
  GRACE_PERIOD_DAYS,
  RENEWAL_REMINDER_DAYS_BEFORE,
  SUSPENSION_AFTER_EXPIRY_DAYS,
  isExpiryReminderDue,
  isGraceReminderDue,
  isPastGracePeriod,
  isPastSuspensionThreshold,
  isRenewalReminderDue,
  wholeDaysBetween,
} from "./subscription-reminder.helpers";
import type { SubscriptionEntity } from "../domain/subscription.entity";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CURRENT_PERIOD_END = new Date("2026-02-15T00:00:00.000Z");

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function makeSubscription(overrides: Partial<SubscriptionEntity> = {}): SubscriptionEntity {
  return {
    id: "sub-1",
    tenantId: "tenant-1",
    subscriptionPlanDefinitionId: "plan-def-1",
    plan: "STANDARD",
    status: "ACTIVE",
    billingCycle: "MONTHLY",
    priceAtAssignment: 1000,
    currency: "INR",
    autoRenew: true,
    trialEndsAt: null,
    currentPeriodStart: addDays(CURRENT_PERIOD_END, -30),
    currentPeriodEnd: CURRENT_PERIOD_END,
    effectiveFrom: addDays(CURRENT_PERIOD_END, -30),
    effectiveTo: null,
    gatewaySubscriptionId: null,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    createdAt: addDays(CURRENT_PERIOD_END, -60),
    updatedAt: addDays(CURRENT_PERIOD_END, -30),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  } as SubscriptionEntity;
}

describe("wholeDaysBetween", () => {
  it("returns whole days truncated toward zero", () => {
    expect(wholeDaysBetween(new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-08T00:00:00.000Z"))).toBe(7);
    expect(wholeDaysBetween(new Date("2026-01-01T12:00:00.000Z"), new Date("2026-01-02T00:00:00.000Z"))).toBe(0);
  });
});

describe("isRenewalReminderDue", () => {
  it(`is true exactly ${RENEWAL_REMINDER_DAYS_BEFORE} days before currentPeriodEnd (window boundary, inclusive)`, () => {
    const subscription = makeSubscription({ status: "ACTIVE", autoRenew: true });
    const asOf = addDays(CURRENT_PERIOD_END, -RENEWAL_REMINDER_DAYS_BEFORE);
    expect(isRenewalReminderDue(subscription, asOf)).toBe(true);
  });

  it("is false one day outside the window (8 days before)", () => {
    const subscription = makeSubscription({ status: "ACTIVE", autoRenew: true });
    const asOf = addDays(CURRENT_PERIOD_END, -(RENEWAL_REMINDER_DAYS_BEFORE + 1));
    expect(isRenewalReminderDue(subscription, asOf)).toBe(false);
  });

  it("is true one day inside the window (6 days before)", () => {
    const subscription = makeSubscription({ status: "ACTIVE", autoRenew: true });
    const asOf = addDays(CURRENT_PERIOD_END, -(RENEWAL_REMINDER_DAYS_BEFORE - 1));
    expect(isRenewalReminderDue(subscription, asOf)).toBe(true);
  });

  it("is true exactly at currentPeriodEnd", () => {
    const subscription = makeSubscription({ status: "ACTIVE", autoRenew: true });
    expect(isRenewalReminderDue(subscription, CURRENT_PERIOD_END)).toBe(true);
  });

  it("is false one day after currentPeriodEnd (period has already lapsed)", () => {
    const subscription = makeSubscription({ status: "ACTIVE", autoRenew: true });
    expect(isRenewalReminderDue(subscription, addDays(CURRENT_PERIOD_END, 1))).toBe(false);
  });

  it("is false when status is not ACTIVE", () => {
    const subscription = makeSubscription({ status: "PAST_DUE", autoRenew: true });
    expect(isRenewalReminderDue(subscription, addDays(CURRENT_PERIOD_END, -1))).toBe(false);
  });

  it("is false when autoRenew is false", () => {
    const subscription = makeSubscription({ status: "ACTIVE", autoRenew: false });
    expect(isRenewalReminderDue(subscription, addDays(CURRENT_PERIOD_END, -1))).toBe(false);
  });
});

describe("isGraceReminderDue", () => {
  it("is true for every day the subscription remains PAST_DUE, regardless of asOf", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isGraceReminderDue(subscription, CURRENT_PERIOD_END)).toBe(true);
    expect(isGraceReminderDue(subscription, addDays(CURRENT_PERIOD_END, 100))).toBe(true);
  });

  it("is false when status is not PAST_DUE", () => {
    const subscription = makeSubscription({ status: "ACTIVE" });
    expect(isGraceReminderDue(subscription, CURRENT_PERIOD_END)).toBe(false);
  });
});

describe("isExpiryReminderDue", () => {
  const graceEnd = addDays(CURRENT_PERIOD_END, GRACE_PERIOD_DAYS);

  it("is false 3 days before grace end (outside the final-2-days window)", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isExpiryReminderDue(subscription, addDays(graceEnd, -3))).toBe(false);
  });

  it("is true exactly 2 days before grace end (window boundary, inclusive)", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isExpiryReminderDue(subscription, addDays(graceEnd, -2))).toBe(true);
  });

  it("is true 1 day before grace end", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isExpiryReminderDue(subscription, addDays(graceEnd, -1))).toBe(true);
  });

  it("is true exactly at grace end", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isExpiryReminderDue(subscription, graceEnd)).toBe(true);
  });

  it("is false one day after grace end", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isExpiryReminderDue(subscription, addDays(graceEnd, 1))).toBe(false);
  });

  it("is false when status is not PAST_DUE", () => {
    const subscription = makeSubscription({ status: "ACTIVE" });
    expect(isExpiryReminderDue(subscription, addDays(graceEnd, -1))).toBe(false);
  });
});

describe("isPastGracePeriod", () => {
  const graceEnd = addDays(CURRENT_PERIOD_END, GRACE_PERIOD_DAYS);

  it("is false exactly at the grace-period boundary", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isPastGracePeriod(subscription, graceEnd)).toBe(false);
  });

  it("is true one day past the grace-period boundary", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isPastGracePeriod(subscription, addDays(graceEnd, 1))).toBe(true);
  });

  it("is false one day before the grace-period boundary", () => {
    const subscription = makeSubscription({ status: "PAST_DUE" });
    expect(isPastGracePeriod(subscription, addDays(graceEnd, -1))).toBe(false);
  });

  it("is false when status is not PAST_DUE", () => {
    const subscription = makeSubscription({ status: "EXPIRED" });
    expect(isPastGracePeriod(subscription, addDays(graceEnd, 1))).toBe(false);
  });
});

describe("isPastSuspensionThreshold", () => {
  const updatedAt = new Date("2026-02-15T00:00:00.000Z");
  const threshold = addDays(updatedAt, SUSPENSION_AFTER_EXPIRY_DAYS);

  it("is false exactly at the suspension threshold", () => {
    const subscription = makeSubscription({ status: "EXPIRED", updatedAt });
    expect(isPastSuspensionThreshold(subscription, threshold)).toBe(false);
  });

  it("is true one day past the suspension threshold", () => {
    const subscription = makeSubscription({ status: "EXPIRED", updatedAt });
    expect(isPastSuspensionThreshold(subscription, addDays(threshold, 1))).toBe(true);
  });

  it("is false one day before the suspension threshold", () => {
    const subscription = makeSubscription({ status: "EXPIRED", updatedAt });
    expect(isPastSuspensionThreshold(subscription, addDays(threshold, -1))).toBe(false);
  });

  it("is false when status is not EXPIRED", () => {
    const subscription = makeSubscription({ status: "PAST_DUE", updatedAt });
    expect(isPastSuspensionThreshold(subscription, addDays(threshold, 1))).toBe(false);
  });
});
