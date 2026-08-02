import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  toEntity: vi.fn((row: unknown) => row),
  createSubscription: vi.fn(),
  generateSubscriptionInvoice: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findMany: mocks.findMany } },
}));

vi.mock("../infrastructure/prisma-subscription.repository", () => ({
  toEntity: mocks.toEntity,
}));

vi.mock("./subscription.service", () => ({
  createSubscription: mocks.createSubscription,
}));

vi.mock("./generate-subscription-invoice.service", () => ({
  generateSubscriptionInvoice: mocks.generateSubscriptionInvoice,
}));

import { processAutoRenewals } from "./auto-renewal.service";

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub-1",
    tenantId: "tenant-1",
    subscriptionPlanDefinitionId: "plan-def-1",
    billingCycle: "MONTHLY",
    autoRenew: true,
    status: "ACTIVE",
    currentPeriodEnd: new Date("2026-02-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("processAutoRenewals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only current, ACTIVE, autoRenew subscriptions whose period has already ended", async () => {
    mocks.findMany.mockResolvedValue([]);
    const asOf = new Date("2026-02-02T00:00:00.000Z");

    await processAutoRenewals(asOf);

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { effectiveTo: null, status: "ACTIVE", autoRenew: true, currentPeriodEnd: { lte: asOf } },
    });
  });

  it("renews a due MONTHLY subscription: extends the period by 1 month and generates its invoice", async () => {
    const subscription = makeSubscription();
    mocks.findMany.mockResolvedValue([subscription]);
    mocks.createSubscription.mockResolvedValue({ id: "sub-2" });
    mocks.generateSubscriptionInvoice.mockResolvedValue({ id: "inv-1" });

    const asOf = new Date("2026-02-02T00:00:00.000Z");
    const result = await processAutoRenewals(asOf);

    expect(mocks.createSubscription).toHaveBeenCalledWith(
      {
        subscriptionPlanDefinitionId: "plan-def-1",
        billingCycle: "MONTHLY",
        effectiveFrom: subscription.currentPeriodEnd,
        autoRenew: true,
      },
      { tenantId: "tenant-1", actingUserId: "system:daily-renewal-job" }
    );

    expect(mocks.generateSubscriptionInvoice).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      subscriptionId: "sub-2",
      billingRunId: null,
      billingPeriod: "2026-02",
      periodStart: subscription.currentPeriodEnd,
      periodEnd: new Date(Date.UTC(2026, 2, 1)),
      dueDate: subscription.currentPeriodEnd,
      actingUserId: "system:daily-renewal-job",
    });

    expect(result).toEqual({ processed: 1, renewedTenantIds: ["tenant-1"], failedTenantIds: [] });
  });

  it("renews a due ANNUAL subscription: extends the period by 12 months", async () => {
    const subscription = makeSubscription({
      id: "sub-annual",
      tenantId: "tenant-annual",
      billingCycle: "ANNUAL",
      currentPeriodEnd: new Date("2026-01-10T00:00:00.000Z"),
    });
    mocks.findMany.mockResolvedValue([subscription]);
    mocks.createSubscription.mockResolvedValue({ id: "sub-annual-2" });
    mocks.generateSubscriptionInvoice.mockResolvedValue({ id: "inv-2" });

    await processAutoRenewals(new Date("2026-01-11T00:00:00.000Z"));

    expect(mocks.generateSubscriptionInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        billingPeriod: "2026-01",
        periodStart: subscription.currentPeriodEnd,
        periodEnd: new Date(Date.UTC(2027, 0, 10)),
      })
    );
  });

  it("returns an empty result and calls nothing downstream when no subscription is due", async () => {
    mocks.findMany.mockResolvedValue([]);

    const result = await processAutoRenewals(new Date("2026-02-02T00:00:00.000Z"));

    expect(result).toEqual({ processed: 0, renewedTenantIds: [], failedTenantIds: [] });
    expect(mocks.createSubscription).not.toHaveBeenCalled();
    expect(mocks.generateSubscriptionInvoice).not.toHaveBeenCalled();
  });

  it("one subscription's createSubscription failure does not prevent a second, independent subscription from succeeding", async () => {
    const failing = makeSubscription({ id: "sub-fail", tenantId: "tenant-fail" });
    const succeeding = makeSubscription({ id: "sub-ok", tenantId: "tenant-ok" });
    mocks.findMany.mockResolvedValue([failing, succeeding]);
    mocks.createSubscription.mockRejectedValueOnce(new Error("gateway down")).mockResolvedValueOnce({ id: "sub-ok-2" });
    mocks.generateSubscriptionInvoice.mockResolvedValue({ id: "inv-ok" });

    const result = await processAutoRenewals(new Date("2026-02-02T00:00:00.000Z"));

    expect(result.processed).toBe(2);
    expect(result.renewedTenantIds).toEqual(["tenant-ok"]);
    expect(result.failedTenantIds).toEqual(["tenant-fail"]);
    expect(mocks.generateSubscriptionInvoice).toHaveBeenCalledTimes(1);
    expect(mocks.generateSubscriptionInvoice).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "tenant-ok", subscriptionId: "sub-ok-2" }));
  });

  it("a second subscription's generateSubscriptionInvoice failure is isolated from the first subscription's success", async () => {
    const succeeding = makeSubscription({ id: "sub-ok", tenantId: "tenant-ok" });
    const failing = makeSubscription({ id: "sub-fail", tenantId: "tenant-fail" });
    mocks.findMany.mockResolvedValue([succeeding, failing]);
    mocks.createSubscription.mockResolvedValueOnce({ id: "sub-ok-2" }).mockResolvedValueOnce({ id: "sub-fail-2" });
    mocks.generateSubscriptionInvoice.mockResolvedValueOnce({ id: "inv-ok" }).mockRejectedValueOnce(new Error("duplicate invoice"));

    const result = await processAutoRenewals(new Date("2026-02-02T00:00:00.000Z"));

    expect(result.renewedTenantIds).toEqual(["tenant-ok"]);
    expect(result.failedTenantIds).toEqual(["tenant-fail"]);
  });
});
