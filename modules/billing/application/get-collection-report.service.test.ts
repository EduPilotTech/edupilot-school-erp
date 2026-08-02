import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  paymentGroupBy: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    payment: {
      groupBy: mocks.paymentGroupBy,
    },
  },
}));

import { getCollectionReport } from "./get-collection-report.service";

function decimal(value: number) {
  return { toNumber: () => value };
}

describe("getCollectionReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries CAPTURED payments within the [fromDate, toDate] range, grouped by gateway provider", async () => {
    mocks.paymentGroupBy.mockResolvedValue([
      { gatewayProvider: "RAZORPAY", _sum: { amount: decimal(15000) }, _count: { _all: 3 } },
      { gatewayProvider: "PHONEPE", _sum: { amount: decimal(5000) }, _count: { _all: 1 } },
    ]);

    const fromDate = new Date("2026-08-01T00:00:00.000Z");
    const toDate = new Date("2026-08-31T23:59:59.999Z");
    const report = await getCollectionReport(fromDate, toDate);

    expect(mocks.paymentGroupBy).toHaveBeenCalledWith({
      by: ["gatewayProvider"],
      where: { status: "CAPTURED", capturedAt: { gte: fromDate, lte: toDate } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    expect(report.fromDate).toBe("2026-08-01");
    expect(report.toDate).toBe("2026-08-31");
    expect(report.byGatewayProvider).toEqual([
      { gatewayProvider: "RAZORPAY", amount: 15000, count: 3 },
      { gatewayProvider: "PHONEPE", amount: 5000, count: 1 },
    ]);
    expect(report.totalCollected).toBe(20000);
    expect(report.paymentCount).toBe(4);
  });

  it("returns a zeroed-out report when there is no CAPTURED activity in range", async () => {
    mocks.paymentGroupBy.mockResolvedValue([]);

    const report = await getCollectionReport(new Date("2026-01-01"), new Date("2026-01-31"));

    expect(report.byGatewayProvider).toEqual([]);
    expect(report.totalCollected).toBe(0);
    expect(report.paymentCount).toBe(0);
  });

  it("defaults a null _sum.amount to 0 for a gateway row", async () => {
    mocks.paymentGroupBy.mockResolvedValue([{ gatewayProvider: "RAZORPAY", _sum: { amount: null }, _count: { _all: 0 } }]);

    const report = await getCollectionReport(new Date("2026-01-01"), new Date("2026-01-31"));

    expect(report.byGatewayProvider).toEqual([{ gatewayProvider: "RAZORPAY", amount: 0, count: 0 }]);
  });

  it("formats fromDate/toDate as date-only strings regardless of the time-of-day component passed in", async () => {
    mocks.paymentGroupBy.mockResolvedValue([]);

    const report = await getCollectionReport(new Date("2026-03-15T18:45:00.000Z"), new Date("2026-03-20T05:15:00.000Z"));

    expect(report.fromDate).toBe("2026-03-15");
    expect(report.toDate).toBe("2026-03-20");
  });
});
