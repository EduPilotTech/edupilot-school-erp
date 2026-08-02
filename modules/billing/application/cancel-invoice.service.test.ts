import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  updateStatus: vi.fn(),
  getSubscriptionInvoice: vi.fn(),
  toSubscriptionInvoiceDTO: vi.fn(),
  recordPlatformAudit: vi.fn(),
}));

vi.mock("../infrastructure/prisma-subscription-invoice.repository", () => ({
  PrismaSubscriptionInvoiceRepository: class {
    updateStatus = mocks.updateStatus;
  },
}));

vi.mock("./generate-subscription-invoice.service", () => ({
  getSubscriptionInvoice: mocks.getSubscriptionInvoice,
  toSubscriptionInvoiceDTO: mocks.toSubscriptionInvoiceDTO,
}));

vi.mock("./billing-audit.helpers", () => ({
  recordPlatformAudit: mocks.recordPlatformAudit,
}));

import { ValidationError } from "@/lib/errors";
import { InvalidInvoiceStatusTransitionError } from "../domain/errors";
import { cancelInvoice } from "./cancel-invoice.service";
import type { BillingContext } from "./billing-context";

const CONTEXT: BillingContext = { tenantId: "tenant-1", actingUserId: "user-1" };

const BASE_INVOICE_DTO = {
  id: "inv-1",
  tenantId: "tenant-1",
  subscriptionId: "sub-1",
  billingRunId: null,
  invoiceNumber: "INV/2025-26/0001",
  billingPeriod: "2026-08",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-31",
  planAtInvoice: "BASIC",
  amount: 1000,
  taxAmount: 0,
  totalAmount: 1000,
  currency: "INR",
  status: "ISSUED",
  issuedAt: "2026-08-01T00:00:00.000Z",
  dueDate: "2026-08-15",
  paidAt: null,
};

describe("cancelInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ValidationError for an empty reason and never loads the invoice", async () => {
    await expect(cancelInvoice("tenant-1", "inv-1", { reason: "" }, CONTEXT)).rejects.toBeInstanceOf(ValidationError);
    expect(mocks.getSubscriptionInvoice).not.toHaveBeenCalled();
  });

  it("throws ValidationError when reason is missing entirely", async () => {
    await expect(cancelInvoice("tenant-1", "inv-1", {}, CONTEXT)).rejects.toBeInstanceOf(ValidationError);
    expect(mocks.getSubscriptionInvoice).not.toHaveBeenCalled();
  });

  it("throws ValidationError when reason is only whitespace", async () => {
    await expect(cancelInvoice("tenant-1", "inv-1", { reason: "   " }, CONTEXT)).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws InvalidInvoiceStatusTransitionError for a PAID invoice", async () => {
    mocks.getSubscriptionInvoice.mockResolvedValue({ ...BASE_INVOICE_DTO, status: "PAID" });

    await expect(cancelInvoice("tenant-1", "inv-1", { reason: "Duplicate invoice" }, CONTEXT)).rejects.toBeInstanceOf(
      InvalidInvoiceStatusTransitionError
    );
    expect(mocks.updateStatus).not.toHaveBeenCalled();
    expect(mocks.recordPlatformAudit).not.toHaveBeenCalled();
  });

  it("throws InvalidInvoiceStatusTransitionError for an already-VOID invoice", async () => {
    mocks.getSubscriptionInvoice.mockResolvedValue({ ...BASE_INVOICE_DTO, status: "VOID" });

    await expect(cancelInvoice("tenant-1", "inv-1", { reason: "Duplicate invoice" }, CONTEXT)).rejects.toBeInstanceOf(
      InvalidInvoiceStatusTransitionError
    );
    expect(mocks.updateStatus).not.toHaveBeenCalled();
    expect(mocks.recordPlatformAudit).not.toHaveBeenCalled();
  });

  it("cancels an ISSUED invoice, persists VOID status, and records the audit trail with the reason", async () => {
    mocks.getSubscriptionInvoice.mockResolvedValue({ ...BASE_INVOICE_DTO, status: "ISSUED" });
    mocks.updateStatus.mockResolvedValue({ id: "inv-1", status: "VOID" });
    mocks.toSubscriptionInvoiceDTO.mockReturnValue({ ...BASE_INVOICE_DTO, status: "VOID" });
    mocks.recordPlatformAudit.mockResolvedValue(undefined);

    const result = await cancelInvoice("tenant-1", "inv-1", { reason: "Duplicate invoice" }, CONTEXT);

    expect(mocks.updateStatus).toHaveBeenCalledWith("tenant-1", "inv-1", { status: "VOID", updatedBy: "user-1" });
    expect(mocks.recordPlatformAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        actorId: "user-1",
        action: "INVOICE_CANCELLED",
        entityType: "SubscriptionInvoice",
        entityId: "inv-1",
        beforeState: { ...BASE_INVOICE_DTO, status: "ISSUED" },
        afterState: expect.objectContaining({ status: "VOID", cancellationReason: "Duplicate invoice" }),
      })
    );
    expect(result.status).toBe("VOID");
  });

  it("also succeeds for a PARTIALLY_PAID invoice", async () => {
    mocks.getSubscriptionInvoice.mockResolvedValue({ ...BASE_INVOICE_DTO, status: "PARTIALLY_PAID" });
    mocks.updateStatus.mockResolvedValue({ id: "inv-1", status: "VOID" });
    mocks.toSubscriptionInvoiceDTO.mockReturnValue({ ...BASE_INVOICE_DTO, status: "VOID" });
    mocks.recordPlatformAudit.mockResolvedValue(undefined);

    await cancelInvoice("tenant-1", "inv-1", { reason: "Refund requested" }, CONTEXT);

    expect(mocks.updateStatus).toHaveBeenCalledWith("tenant-1", "inv-1", { status: "VOID", updatedBy: "user-1" });
  });
});
