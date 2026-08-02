import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  toEntity: vi.fn((row: unknown) => row),
  moveToExpired: vi.fn(),
  moveToGracePeriod: vi.fn(),
  suspendSchool: vi.fn(),
  sendRenewalReminders: vi.fn(),
  sendGraceReminders: vi.fn(),
  sendExpiryReminders: vi.fn(),
  processAutoRenewals: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findMany: mocks.findMany } },
}));

vi.mock("../infrastructure/prisma-subscription.repository", () => ({
  toEntity: mocks.toEntity,
}));

vi.mock("./subscription-lifecycle.service", () => ({
  moveToExpired: mocks.moveToExpired,
  moveToGracePeriod: mocks.moveToGracePeriod,
}));

vi.mock("./school-activation.service", () => ({
  suspendSchool: mocks.suspendSchool,
}));

vi.mock("./subscription-reminder.service", () => ({
  sendRenewalReminders: mocks.sendRenewalReminders,
  sendGraceReminders: mocks.sendGraceReminders,
  sendExpiryReminders: mocks.sendExpiryReminders,
}));

vi.mock("./auto-renewal.service", () => ({
  processAutoRenewals: mocks.processAutoRenewals,
}));

import { SchoolStatusUnchangedError } from "../domain/errors";
import {
  runDailyExpiryProcessing,
  runDailyRenewalProcessing,
  runDailySubscriptionValidation,
} from "./daily-subscription-jobs.service";
import type { PlatformBillingContext } from "./billing-context";

const CONTEXT: PlatformBillingContext = { actingUserId: "platform-1" };
const ASOF = new Date("2026-03-01T00:00:00.000Z");
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    tenantId: "tenant-1",
    status: "ACTIVE",
    trialEndsAt: null,
    currentPeriodEnd: addDays(ASOF, 30),
    updatedAt: addDays(ASOF, -30),
    ...overrides,
  };
}

describe("runDailySubscriptionValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.moveToExpired.mockResolvedValue(undefined);
    mocks.moveToGracePeriod.mockResolvedValue(undefined);
  });

  it("moves a stale TRIALING subscription to EXPIRED and an ended-period ACTIVE subscription to grace, leaving current ones untouched", async () => {
    const staleTrial = makeSubscription({ id: "sub-trial", tenantId: "tenant-trial", status: "TRIALING", trialEndsAt: addDays(ASOF, -1) });
    const endedActive = makeSubscription({ id: "sub-active", tenantId: "tenant-active", status: "ACTIVE", currentPeriodEnd: addDays(ASOF, -1) });
    const freshTrial = makeSubscription({ id: "sub-fresh-trial", tenantId: "tenant-fresh-trial", status: "TRIALING", trialEndsAt: addDays(ASOF, 10) });
    const freshActive = makeSubscription({ id: "sub-fresh-active", tenantId: "tenant-fresh-active", status: "ACTIVE", currentPeriodEnd: addDays(ASOF, 10) });
    const pastDue = makeSubscription({ id: "sub-past-due", tenantId: "tenant-past-due", status: "PAST_DUE" });

    mocks.findMany.mockResolvedValue([staleTrial, endedActive, freshTrial, freshActive, pastDue]);

    const result = await runDailySubscriptionValidation(ASOF, CONTEXT);

    expect(mocks.moveToExpired).toHaveBeenCalledTimes(1);
    expect(mocks.moveToExpired).toHaveBeenCalledWith("tenant-trial", "sub-trial", { tenantId: "tenant-trial", actingUserId: "platform-1" });

    expect(mocks.moveToGracePeriod).toHaveBeenCalledTimes(1);
    expect(mocks.moveToGracePeriod).toHaveBeenCalledWith("tenant-active", "sub-active", { tenantId: "tenant-active", actingUserId: "platform-1" });

    expect(result).toEqual({
      validated: 5,
      movedToExpired: ["tenant-trial"],
      movedToGracePeriod: ["tenant-active"],
      failed: [],
    });
  });

  it("falls back to the system actor when context.actingUserId is null", async () => {
    const staleTrial = makeSubscription({ id: "sub-trial", tenantId: "tenant-trial", status: "TRIALING", trialEndsAt: addDays(ASOF, -1) });
    mocks.findMany.mockResolvedValue([staleTrial]);

    await runDailySubscriptionValidation(ASOF, { actingUserId: null });

    expect(mocks.moveToExpired).toHaveBeenCalledWith("tenant-trial", "sub-trial", {
      tenantId: "tenant-trial",
      actingUserId: "system:daily-validation-job",
    });
  });

  it("isolates one subscription's failure from another's success in the same sweep", async () => {
    const failing = makeSubscription({ id: "sub-fail", tenantId: "tenant-fail", status: "TRIALING", trialEndsAt: addDays(ASOF, -1) });
    const succeeding = makeSubscription({ id: "sub-ok", tenantId: "tenant-ok", status: "TRIALING", trialEndsAt: addDays(ASOF, -1) });
    mocks.findMany.mockResolvedValue([failing, succeeding]);
    mocks.moveToExpired.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce(undefined);

    const result = await runDailySubscriptionValidation(ASOF, CONTEXT);

    expect(result.failed).toEqual(["tenant-fail"]);
    expect(result.movedToExpired).toEqual(["tenant-ok"]);
  });
});

describe("runDailyExpiryProcessing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.moveToExpired.mockResolvedValue(undefined);
    mocks.sendGraceReminders.mockResolvedValue({ candidateCount: 2, notifiedTenantIds: ["t-grace-a", "t-grace-b"], failedTenantIds: [] });
    mocks.sendExpiryReminders.mockResolvedValue({ candidateCount: 1, notifiedTenantIds: ["t-expiry-a"], failedTenantIds: ["t-expiry-fail"] });
  });

  it("identifies grace-exhausted PAST_DUE and suspension-threshold EXPIRED subscriptions independently, and dispatches both reminder sweeps", async () => {
    const pastDueExhausted = makeSubscription({
      id: "sub-past-due-exhausted",
      tenantId: "tenant-past-due-exhausted",
      status: "PAST_DUE",
      currentPeriodEnd: addDays(ASOF, -10), // graceEnd = asOf - 3 days -> past
    });
    const pastDueStillInGrace = makeSubscription({
      id: "sub-past-due-fresh",
      tenantId: "tenant-past-due-fresh",
      status: "PAST_DUE",
      currentPeriodEnd: addDays(ASOF, -1), // graceEnd = asOf + 6 days -> not past
    });
    const expiredSuspendable = makeSubscription({
      id: "sub-expired-suspendable",
      tenantId: "tenant-expired-suspendable",
      status: "EXPIRED",
      updatedAt: addDays(ASOF, -40), // threshold = asOf - 10 days -> past
    });
    const expiredNotYet = makeSubscription({
      id: "sub-expired-not-yet",
      tenantId: "tenant-expired-not-yet",
      status: "EXPIRED",
      updatedAt: addDays(ASOF, -5), // threshold = asOf + 25 days -> not past
    });

    mocks.findMany.mockResolvedValue([pastDueExhausted, pastDueStillInGrace, expiredSuspendable, expiredNotYet]);
    mocks.suspendSchool.mockResolvedValue(undefined);

    const result = await runDailyExpiryProcessing(ASOF, CONTEXT);

    expect(mocks.moveToExpired).toHaveBeenCalledTimes(1);
    expect(mocks.moveToExpired).toHaveBeenCalledWith("tenant-past-due-exhausted", "sub-past-due-exhausted", {
      tenantId: "tenant-past-due-exhausted",
      actingUserId: "platform-1",
    });

    expect(mocks.suspendSchool).toHaveBeenCalledTimes(1);
    expect(mocks.suspendSchool).toHaveBeenCalledWith(
      "tenant-expired-suspendable",
      { reason: "Subscription expired and was not renewed within the grace period." },
      CONTEXT
    );

    expect(mocks.sendGraceReminders).toHaveBeenCalledWith(ASOF);
    expect(mocks.sendExpiryReminders).toHaveBeenCalledWith(ASOF);

    expect(result).toEqual({
      movedToExpired: ["tenant-past-due-exhausted"],
      suspendedTenantIds: ["tenant-expired-suspendable"],
      graceRemindersSent: 2,
      expiryRemindersSent: 1,
      failed: [],
    });
  });

  it("skips an already-suspended tenant silently — not counted as a failure", async () => {
    const alreadySuspended = makeSubscription({
      id: "sub-already-suspended",
      tenantId: "tenant-already-suspended",
      status: "EXPIRED",
      updatedAt: addDays(ASOF, -60),
    });
    mocks.findMany.mockResolvedValue([alreadySuspended]);
    mocks.suspendSchool.mockRejectedValue(new SchoolStatusUnchangedError("This school is already suspended."));

    const result = await runDailyExpiryProcessing(ASOF, CONTEXT);

    expect(result.suspendedTenantIds).toEqual([]);
    expect(result.failed).toEqual([]);
  });

  it("counts a genuine suspendSchool error (not SchoolStatusUnchangedError) as a failure", async () => {
    const subscription = makeSubscription({
      id: "sub-genuine-fail",
      tenantId: "tenant-genuine-fail",
      status: "EXPIRED",
      updatedAt: addDays(ASOF, -60),
    });
    mocks.findMany.mockResolvedValue([subscription]);
    mocks.suspendSchool.mockRejectedValue(new Error("database unavailable"));

    const result = await runDailyExpiryProcessing(ASOF, CONTEXT);

    expect(result.suspendedTenantIds).toEqual([]);
    expect(result.failed).toEqual(["tenant-genuine-fail"]);
  });

  it("isolates one subscription's moveToExpired failure from another's success", async () => {
    const failing = makeSubscription({ id: "sub-fail", tenantId: "tenant-fail", status: "PAST_DUE", currentPeriodEnd: addDays(ASOF, -10) });
    const succeeding = makeSubscription({ id: "sub-ok", tenantId: "tenant-ok", status: "PAST_DUE", currentPeriodEnd: addDays(ASOF, -10) });
    mocks.findMany.mockResolvedValue([failing, succeeding]);
    mocks.moveToExpired.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce(undefined);

    const result = await runDailyExpiryProcessing(ASOF, CONTEXT);

    expect(result.failed).toEqual(["tenant-fail"]);
    expect(result.movedToExpired).toEqual(["tenant-ok"]);
  });
});

describe("runDailyRenewalProcessing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendRenewalReminders before processAutoRenewals and aggregates both results", async () => {
    const callOrder: string[] = [];
    mocks.sendRenewalReminders.mockImplementation(async () => {
      callOrder.push("sendRenewalReminders");
      return { candidateCount: 3, notifiedTenantIds: ["t-1", "t-2"], failedTenantIds: ["t-3"] };
    });
    mocks.processAutoRenewals.mockImplementation(async () => {
      callOrder.push("processAutoRenewals");
      return { processed: 1, renewedTenantIds: ["t-4"], failedTenantIds: [] };
    });

    const result = await runDailyRenewalProcessing(ASOF);

    expect(callOrder).toEqual(["sendRenewalReminders", "processAutoRenewals"]);
    expect(mocks.sendRenewalReminders).toHaveBeenCalledWith(ASOF);
    expect(mocks.processAutoRenewals).toHaveBeenCalledWith(ASOF);
    expect(result).toEqual({
      renewalRemindersSent: 2,
      autoRenewalResult: { processed: 1, renewedTenantIds: ["t-4"], failedTenantIds: [] },
    });
  });
});
