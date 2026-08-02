import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  paymentFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    payment: {
      findMany: mocks.paymentFindMany,
    },
  },
}));

import { getMonthlyRevenueReport } from "./get-monthly-revenue-report.service";

function decimal(value: number) {
  return { toNumber: () => value };
}

describe("getMonthlyRevenueReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries CAPTURED payments within the given calendar year (UTC)", async () => {
    mocks.paymentFindMany.mockResolvedValue([]);

    await getMonthlyRevenueReport(2026);

    expect(mocks.paymentFindMany).toHaveBeenCalledWith({
      where: {
        status: "CAPTURED",
        capturedAt: { gte: new Date(Date.UTC(2026, 0, 1)), lt: new Date(Date.UTC(2027, 0, 1)) },
      },
      select: { amount: true, capturedAt: true },
    });
  });

  it("always returns all 12 months, even with sparse (single-month) activity", async () => {
    mocks.paymentFindMany.mockResolvedValue([{ amount: decimal(1000), capturedAt: new Date(Date.UTC(2026, 4, 15)) }]);

    const report = await getMonthlyRevenueReport(2026);

    expect(report.months).toHaveLength(12);
    expect(report.months.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    const may = report.months.find((m) => m.month === 5);
    expect(may).toEqual({ month: 5, revenue: 1000, paymentCount: 1 });

    for (const bucket of report.months.filter((m) => m.month !== 5)) {
      expect(bucket.revenue).toBe(0);
      expect(bucket.paymentCount).toBe(0);
    }
  });

  it("returns all-zero months when there is no CAPTURED activity in the year", async () => {
    mocks.paymentFindMany.mockResolvedValue([]);

    const report = await getMonthlyRevenueReport(2026);

    expect(report.months.every((m) => m.revenue === 0 && m.paymentCount === 0)).toBe(true);
    expect(report.year).toBe(2026);
  });

  it("accumulates multiple payments captured within the same month", async () => {
    mocks.paymentFindMany.mockResolvedValue([
      { amount: decimal(500), capturedAt: new Date(Date.UTC(2026, 0, 5)) },
      { amount: decimal(750), capturedAt: new Date(Date.UTC(2026, 0, 20)) },
    ]);

    const report = await getMonthlyRevenueReport(2026);

    const january = report.months.find((m) => m.month === 1);
    expect(january).toEqual({ month: 1, revenue: 1250, paymentCount: 2 });
  });

  it("buckets by the payment's own capturedAt UTC month, not array order", async () => {
    mocks.paymentFindMany.mockResolvedValue([
      { amount: decimal(300), capturedAt: new Date(Date.UTC(2026, 11, 31)) },
      { amount: decimal(100), capturedAt: new Date(Date.UTC(2026, 0, 1)) },
    ]);

    const report = await getMonthlyRevenueReport(2026);

    expect(report.months.find((m) => m.month === 12)).toEqual({ month: 12, revenue: 300, paymentCount: 1 });
    expect(report.months.find((m) => m.month === 1)).toEqual({ month: 1, revenue: 100, paymentCount: 1 });
  });

  it("skips a payment with a null capturedAt rather than crashing", async () => {
    mocks.paymentFindMany.mockResolvedValue([{ amount: decimal(999), capturedAt: null }]);

    const report = await getMonthlyRevenueReport(2026);

    expect(report.months.every((m) => m.revenue === 0 && m.paymentCount === 0)).toBe(true);
  });
});
