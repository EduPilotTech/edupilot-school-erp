import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  invoiceGroupBy: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscriptionInvoice: {
      groupBy: mocks.invoiceGroupBy,
    },
  },
}));

import { getOutstandingReport } from "./get-outstanding-report.service";

function decimal(value: number) {
  return { toNumber: () => value };
}

describe("getOutstandingReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries invoices in ISSUED/PARTIALLY_PAID/OVERDUE status grouped by tenant", async () => {
    mocks.invoiceGroupBy.mockResolvedValue([]);

    await getOutstandingReport();

    expect(mocks.invoiceGroupBy).toHaveBeenCalledWith({
      by: ["tenantId"],
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });
  });

  it("orders tenants by outstandingAmount descending", async () => {
    mocks.invoiceGroupBy.mockResolvedValue([
      { tenantId: "tenant-small", _sum: { totalAmount: decimal(500) }, _count: { _all: 1 } },
      { tenantId: "tenant-large", _sum: { totalAmount: decimal(5000) }, _count: { _all: 4 } },
      { tenantId: "tenant-medium", _sum: { totalAmount: decimal(2000) }, _count: { _all: 2 } },
    ]);

    const report = await getOutstandingReport();

    expect(report.byTenant.map((row) => row.tenantId)).toEqual(["tenant-large", "tenant-medium", "tenant-small"]);
  });

  it("sums totalOutstanding and invoiceCount across every tenant", async () => {
    mocks.invoiceGroupBy.mockResolvedValue([
      { tenantId: "tenant-a", _sum: { totalAmount: decimal(500) }, _count: { _all: 1 } },
      { tenantId: "tenant-b", _sum: { totalAmount: decimal(2500) }, _count: { _all: 3 } },
    ]);

    const report = await getOutstandingReport();

    expect(report.totalOutstanding).toBe(3000);
    expect(report.invoiceCount).toBe(4);
  });

  it("returns an empty report when no tenant has outstanding invoices", async () => {
    mocks.invoiceGroupBy.mockResolvedValue([]);

    const report = await getOutstandingReport();

    expect(report).toEqual({ totalOutstanding: 0, invoiceCount: 0, byTenant: [] });
  });

  it("defaults a null _sum.totalAmount to 0", async () => {
    mocks.invoiceGroupBy.mockResolvedValue([{ tenantId: "tenant-a", _sum: { totalAmount: null }, _count: { _all: 0 } }]);

    const report = await getOutstandingReport();

    expect(report.byTenant).toEqual([{ tenantId: "tenant-a", outstandingAmount: 0, invoiceCount: 0 }]);
  });
});
