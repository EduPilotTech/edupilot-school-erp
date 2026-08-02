import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findByTenant: vi.fn(),
}));

vi.mock("../infrastructure/prisma-subscription-invoice.repository", () => ({
  PrismaSubscriptionInvoiceRepository: class {
    findByTenant = mocks.findByTenant;
  },
}));

vi.mock("./generate-subscription-invoice.service", () => ({
  toSubscriptionInvoiceDTO: (entity: Record<string, unknown>) => ({ ...entity, __dto: true }),
}));

import {
  getInvoiceHistory,
  isEffectivelyOverdue,
  listEffectivelyOverdueInvoices,
  listOutstandingInvoices,
  listPaidInvoices,
} from "./list-tenant-invoices.service";
import type { SubscriptionInvoiceEntity } from "../domain/subscription-invoice.entity";

function invoice(overrides: Partial<SubscriptionInvoiceEntity>): SubscriptionInvoiceEntity {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    subscriptionId: "sub-1",
    billingRunId: null,
    invoiceNumber: "INV/2025-26/0001",
    billingPeriod: "2026-08",
    periodStart: new Date("2026-08-01"),
    periodEnd: new Date("2026-08-31"),
    planAtInvoice: "BASIC",
    amount: 1000,
    taxAmount: 0,
    totalAmount: 1000,
    currency: "INR",
    status: "ISSUED",
    issuedAt: new Date("2026-08-01"),
    dueDate: new Date("2026-08-15"),
    paidAt: null,
    storageKey: null,
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

const MIXED_INVOICES: SubscriptionInvoiceEntity[] = [
  invoice({ id: "inv-draft", status: "DRAFT" }),
  invoice({ id: "inv-issued", status: "ISSUED", dueDate: new Date("2099-01-01") }),
  invoice({ id: "inv-paid", status: "PAID" }),
  invoice({ id: "inv-partially-paid", status: "PARTIALLY_PAID", dueDate: new Date("2099-01-01") }),
  invoice({ id: "inv-overdue", status: "OVERDUE" }),
  invoice({ id: "inv-void", status: "VOID" }),
];

describe("list-tenant-invoices.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInvoiceHistory", () => {
    it("returns every invoice for the tenant regardless of status", async () => {
      mocks.findByTenant.mockResolvedValue(MIXED_INVOICES);

      const result = await getInvoiceHistory("tenant-1");

      expect(mocks.findByTenant).toHaveBeenCalledWith("tenant-1");
      expect(result).toHaveLength(6);
    });
  });

  describe("listOutstandingInvoices", () => {
    it("returns only ISSUED, PARTIALLY_PAID, and OVERDUE invoices from a mixed-status list", async () => {
      mocks.findByTenant.mockResolvedValue(MIXED_INVOICES);

      const result = await listOutstandingInvoices("tenant-1");

      expect(result.map((r) => (r as { id: string }).id).sort()).toEqual(
        ["inv-issued", "inv-overdue", "inv-partially-paid"].sort()
      );
    });

    it("does not filter by dueDate — a not-yet-due ISSUED invoice is still outstanding", async () => {
      mocks.findByTenant.mockResolvedValue([invoice({ id: "inv-not-due", status: "ISSUED", dueDate: new Date("2099-01-01") })]);

      const result = await listOutstandingInvoices("tenant-1");

      expect(result).toHaveLength(1);
    });
  });

  describe("listPaidInvoices", () => {
    it("returns only PAID invoices from a mixed-status list", async () => {
      mocks.findByTenant.mockResolvedValue(MIXED_INVOICES);

      const result = await listPaidInvoices("tenant-1");

      expect(result.map((r) => (r as { id: string }).id)).toEqual(["inv-paid"]);
    });

    it("returns an empty array when no invoices are PAID", async () => {
      mocks.findByTenant.mockResolvedValue([invoice({ id: "inv-issued", status: "ISSUED" })]);

      const result = await listPaidInvoices("tenant-1");

      expect(result).toEqual([]);
    });
  });

  describe("listEffectivelyOverdueInvoices", () => {
    it("returns OVERDUE plus past-due ISSUED/PARTIALLY_PAID invoices, excluding not-yet-due ones and PAID", async () => {
      const invoices = [
        invoice({ id: "inv-overdue-status", status: "OVERDUE", dueDate: new Date("2020-01-01") }),
        invoice({ id: "inv-issued-past-due", status: "ISSUED", dueDate: new Date("2020-01-01") }),
        invoice({ id: "inv-partial-past-due", status: "PARTIALLY_PAID", dueDate: new Date("2020-01-01") }),
        invoice({ id: "inv-issued-not-due", status: "ISSUED", dueDate: new Date("2099-01-01") }),
        invoice({ id: "inv-paid", status: "PAID", dueDate: new Date("2020-01-01") }),
      ];
      mocks.findByTenant.mockResolvedValue(invoices);

      const result = await listEffectivelyOverdueInvoices("tenant-1");

      expect(result.map((r) => (r as { id: string }).id).sort()).toEqual(
        ["inv-overdue-status", "inv-issued-past-due", "inv-partial-past-due"].sort()
      );
    });
  });

  describe("isEffectivelyOverdue", () => {
    const now = new Date("2026-08-02T00:00:00.000Z");

    it("is true for OVERDUE status regardless of dueDate", () => {
      expect(isEffectivelyOverdue("OVERDUE", new Date("2099-01-01"), now)).toBe(true);
    });

    it("is true for ISSUED past its dueDate", () => {
      expect(isEffectivelyOverdue("ISSUED", new Date("2020-01-01"), now)).toBe(true);
    });

    it("is true for PARTIALLY_PAID past its dueDate", () => {
      expect(isEffectivelyOverdue("PARTIALLY_PAID", new Date("2020-01-01"), now)).toBe(true);
    });

    it("is false for ISSUED not yet past its dueDate", () => {
      expect(isEffectivelyOverdue("ISSUED", new Date("2099-01-01"), now)).toBe(false);
    });

    it("is false for PAID even past its dueDate", () => {
      expect(isEffectivelyOverdue("PAID", new Date("2020-01-01"), now)).toBe(false);
    });

    it("is false for VOID even past its dueDate", () => {
      expect(isEffectivelyOverdue("VOID", new Date("2020-01-01"), now)).toBe(false);
    });

    it("is false for DRAFT even past its dueDate", () => {
      expect(isEffectivelyOverdue("DRAFT", new Date("2020-01-01"), now)).toBe(false);
    });

    it("defaults referenceDate to now when omitted", () => {
      expect(isEffectivelyOverdue("ISSUED", new Date("2000-01-01"))).toBe(true);
    });
  });
});
