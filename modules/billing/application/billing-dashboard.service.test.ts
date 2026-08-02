import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  subscriptionGroupBy: vi.fn(),
  subscriptionFindMany: vi.fn(),
  invoiceFindMany: vi.fn(),
  paymentAggregate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      groupBy: mocks.subscriptionGroupBy,
      findMany: mocks.subscriptionFindMany,
    },
    subscriptionInvoice: {
      findMany: mocks.invoiceFindMany,
    },
    payment: {
      aggregate: mocks.paymentAggregate,
    },
  },
}));

// Reimplemented locally (rather than importing the real module) so this test doesn't pull in
// PrismaSubscriptionInvoiceRepository / generate-subscription-invoice.service's own chain of
// "@/lib/prisma" imports — this pure predicate is all billing-dashboard.service.ts needs from it.
vi.mock("./list-tenant-invoices.service", () => ({
  isEffectivelyOverdue: (status: string, dueDate: Date, referenceDate: Date = new Date()) => {
    if (status === "OVERDUE") return true;
    return (status === "ISSUED" || status === "PARTIALLY_PAID") && dueDate.getTime() < referenceDate.getTime();
  },
}));

import { getBillingDashboard } from "./billing-dashboard.service";

function decimal(value: number) {
  return { toNumber: () => value };
}

describe("getBillingDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscriptionGroupBy.mockResolvedValue([]);
    mocks.subscriptionFindMany.mockResolvedValue([]);
    mocks.invoiceFindMany.mockResolvedValue([]);
    mocks.paymentAggregate.mockResolvedValue({ _sum: { amount: null } });
  });

  describe("monthlyRecurringRevenue normalization", () => {
    it("divides ANNUAL subscriptions by 12 before summing alongside MONTHLY subscriptions as-is", async () => {
      mocks.subscriptionFindMany.mockResolvedValue([
        { priceAtAssignment: decimal(999), billingCycle: "MONTHLY" },
        { priceAtAssignment: decimal(999), billingCycle: "MONTHLY" },
        { priceAtAssignment: decimal(12000), billingCycle: "ANNUAL" },
        { priceAtAssignment: decimal(6000), billingCycle: "ANNUAL" },
      ]);

      const dashboard = await getBillingDashboard();

      // 999 + 999 + (12000/12=1000) + (6000/12=500) = 3498
      expect(dashboard.monthlyRecurringRevenue).toBe(3498);
    });

    it("returns 0 when there are no ACTIVE subscriptions", async () => {
      mocks.subscriptionFindMany.mockResolvedValue([]);

      const dashboard = await getBillingDashboard();

      expect(dashboard.monthlyRecurringRevenue).toBe(0);
    });

    it("treats a single ANNUAL subscription's contribution correctly on its own", async () => {
      mocks.subscriptionFindMany.mockResolvedValue([{ priceAtAssignment: decimal(24000), billingCycle: "ANNUAL" }]);

      const dashboard = await getBillingDashboard();

      expect(dashboard.monthlyRecurringRevenue).toBe(2000);
    });

    it("would overstate MRR by up to 12x if ANNUAL price were summed unnormalized (regression guard)", async () => {
      mocks.subscriptionFindMany.mockResolvedValue([{ priceAtAssignment: decimal(12000), billingCycle: "ANNUAL" }]);

      const dashboard = await getBillingDashboard();

      expect(dashboard.monthlyRecurringRevenue).toBe(1000);
      expect(dashboard.monthlyRecurringRevenue).not.toBe(12000);
    });

    it("rounds a non-terminating ANNUAL/12 division to 2 decimal places", async () => {
      mocks.subscriptionFindMany.mockResolvedValue([{ priceAtAssignment: decimal(100), billingCycle: "ANNUAL" }]);

      const dashboard = await getBillingDashboard();

      // 100 / 12 = 8.333333333333334 -> rounds to 8.33
      expect(dashboard.monthlyRecurringRevenue).toBe(8.33);
    });

    it("sums a mix of MONTHLY and ANNUAL subscriptions with a rounding-sensitive remainder", async () => {
      mocks.subscriptionFindMany.mockResolvedValue([
        { priceAtAssignment: decimal(499), billingCycle: "MONTHLY" },
        { priceAtAssignment: decimal(1000), billingCycle: "ANNUAL" }, // 83.33...
      ]);

      const dashboard = await getBillingDashboard();

      // 499 + 83.333333333333336 = 582.333... -> rounds to 582.33
      expect(dashboard.monthlyRecurringRevenue).toBe(582.33);
    });

    it("only considers current (effectiveTo: null) ACTIVE subscriptions for MRR", async () => {
      mocks.subscriptionFindMany.mockResolvedValue([{ priceAtAssignment: decimal(999), billingCycle: "MONTHLY" }]);

      await getBillingDashboard();

      expect(mocks.subscriptionFindMany).toHaveBeenCalledWith({
        where: { effectiveTo: null, status: "ACTIVE" },
        select: { priceAtAssignment: true, billingCycle: true },
      });
    });
  });

  describe("subscription status counts", () => {
    it("maps groupBy rows to their respective status counts", async () => {
      mocks.subscriptionGroupBy.mockResolvedValue([
        { status: "ACTIVE", _count: { _all: 5 } },
        { status: "TRIALING", _count: { _all: 2 } },
        { status: "PAST_DUE", _count: { _all: 1 } },
      ]);

      const dashboard = await getBillingDashboard();

      expect(dashboard.activeSubscriptions).toBe(5);
      expect(dashboard.trialingSubscriptions).toBe(2);
      expect(dashboard.pastDueSubscriptions).toBe(1);
    });

    it("defaults a missing status to 0", async () => {
      mocks.subscriptionGroupBy.mockResolvedValue([{ status: "ACTIVE", _count: { _all: 5 } }]);

      const dashboard = await getBillingDashboard();

      expect(dashboard.trialingSubscriptions).toBe(0);
      expect(dashboard.pastDueSubscriptions).toBe(0);
    });
  });

  describe("outstanding + overdue figures", () => {
    it("sums outstanding invoice totalAmount and counts effectively-overdue invoices via isEffectivelyOverdue", async () => {
      mocks.invoiceFindMany.mockResolvedValue([
        { status: "ISSUED", dueDate: new Date("2020-01-01"), totalAmount: decimal(1000) },
        { status: "ISSUED", dueDate: new Date("2099-01-01"), totalAmount: decimal(500) },
        { status: "OVERDUE", dueDate: new Date("2020-01-01"), totalAmount: decimal(2000) },
      ]);

      const dashboard = await getBillingDashboard();

      expect(dashboard.outstandingInvoicesCount).toBe(3);
      expect(dashboard.outstandingAmount).toBe(3500);
      expect(dashboard.overdueInvoicesCount).toBe(2);
    });

    it("reports zero outstanding/overdue when there are no outstanding invoices", async () => {
      mocks.invoiceFindMany.mockResolvedValue([]);

      const dashboard = await getBillingDashboard();

      expect(dashboard.outstandingInvoicesCount).toBe(0);
      expect(dashboard.outstandingAmount).toBe(0);
      expect(dashboard.overdueInvoicesCount).toBe(0);
    });
  });

  describe("collectedThisMonth", () => {
    it("uses the CAPTURED payment aggregate sum", async () => {
      mocks.paymentAggregate.mockResolvedValue({ _sum: { amount: decimal(45000) } });

      const dashboard = await getBillingDashboard();

      expect(dashboard.collectedThisMonth).toBe(45000);
    });

    it("defaults to 0 when there is no captured payment this month", async () => {
      mocks.paymentAggregate.mockResolvedValue({ _sum: { amount: null } });

      const dashboard = await getBillingDashboard();

      expect(dashboard.collectedThisMonth).toBe(0);
    });
  });
});
