import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  updateStorageKey: vi.fn(),
  upload: vi.fn(),
  delete: vi.fn(),
  recordPlatformAudit: vi.fn(),
  toSubscriptionInvoiceDTO: vi.fn(),
}));

vi.mock("../infrastructure/prisma-subscription-invoice.repository", () => ({
  PrismaSubscriptionInvoiceRepository: class {
    findById = mocks.findById;
    updateStorageKey = mocks.updateStorageKey;
  },
}));

vi.mock("@/lib/storage/supabase-storage.service", () => ({
  SupabaseStorageService: class {
    upload = mocks.upload;
    delete = mocks.delete;
  },
}));

vi.mock("./billing-audit.helpers", () => ({
  recordPlatformAudit: mocks.recordPlatformAudit,
}));

vi.mock("./generate-subscription-invoice.service", () => ({
  toSubscriptionInvoiceDTO: mocks.toSubscriptionInvoiceDTO,
}));

vi.mock("../infrastructure/platform-billing-identity.env", () => ({
  getPlatformCompanyName: () => "EduPilot Technologies Pvt Ltd",
  getPlatformCompanyAddress: () => "123 Tech Park, Bengaluru, Karnataka, India",
  getPlatformGstin: () => "29ABCDE1234F1Z5",
}));

vi.mock("./gst-calculation.helpers", async () => {
  const actual = await vi.importActual<typeof import("./gst-calculation.helpers")>("./gst-calculation.helpers");
  return {
    ...actual,
    computeGstBreakdown: vi.fn(actual.computeGstBreakdown),
  };
});

import { SubscriptionInvoiceNotFoundError } from "../domain/errors";
import { computeGstBreakdown } from "./gst-calculation.helpers";
import { generateInvoicePdf, type InvoicePdfContext } from "./invoice-pdf.service";
import type { SubscriptionInvoiceEntity } from "../domain/subscription-invoice.entity";

const BASE_INVOICE: SubscriptionInvoiceEntity = {
  id: "inv-1",
  tenantId: "tenant-1",
  subscriptionId: "sub-1",
  billingRunId: null,
  invoiceNumber: "INV/2025-26/0001",
  billingPeriod: "2026-08",
  periodStart: new Date("2026-08-01"),
  periodEnd: new Date("2026-08-31"),
  planAtInvoice: "PRO",
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
};

const CONTEXT: InvoicePdfContext = {
  tenantId: "tenant-1",
  actingUserId: "user-1",
  billTo: { schoolName: "Greenwood High", address: "45 MG Road, Bengaluru" },
};

const SANITIZED_STORAGE_KEY = "tenant-1/invoices/INV_2025-26_0001.pdf";

describe("generateInvoicePdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toSubscriptionInvoiceDTO.mockImplementation((entity: unknown) => ({ ...(entity as object), dtoMapped: true }));
    mocks.upload.mockResolvedValue({ key: SANITIZED_STORAGE_KEY });
    mocks.updateStorageKey.mockResolvedValue({ ...BASE_INVOICE, storageKey: SANITIZED_STORAGE_KEY });
  });

  it("throws SubscriptionInvoiceNotFoundError when the invoice does not exist", async () => {
    mocks.findById.mockResolvedValue(null);

    await expect(generateInvoicePdf("tenant-1", "missing", { includeGst: true }, CONTEXT)).rejects.toBeInstanceOf(
      SubscriptionInvoiceNotFoundError
    );
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("invokes computeGstBreakdown with the invoice amount and the given rate/interstate flag when includeGst is true", async () => {
    mocks.findById.mockResolvedValue(BASE_INVOICE);

    await generateInvoicePdf("tenant-1", "inv-1", { includeGst: true, gstRatePercent: 18, isInterState: false }, CONTEXT);

    expect(computeGstBreakdown).toHaveBeenCalledWith(1000, 18, false);
  });

  it("defaults gstRatePercent to 18 and isInterState to false when omitted", async () => {
    mocks.findById.mockResolvedValue(BASE_INVOICE);

    await generateInvoicePdf("tenant-1", "inv-1", { includeGst: true }, CONTEXT);

    expect(computeGstBreakdown).toHaveBeenCalledWith(1000, 18, false);
  });

  it("passes isInterState through when explicitly true", async () => {
    mocks.findById.mockResolvedValue(BASE_INVOICE);

    await generateInvoicePdf("tenant-1", "inv-1", { includeGst: true, isInterState: true }, CONTEXT);

    expect(computeGstBreakdown).toHaveBeenCalledWith(1000, 18, true);
  });

  it("does not invoke computeGstBreakdown when includeGst is false (simpler render path)", async () => {
    mocks.findById.mockResolvedValue(BASE_INVOICE);

    await generateInvoicePdf("tenant-1", "inv-1", { includeGst: false }, CONTEXT);

    expect(computeGstBreakdown).not.toHaveBeenCalled();
  });

  it("sanitizes the invoice number for the storage key and uploads before persisting it", async () => {
    mocks.findById.mockResolvedValue(BASE_INVOICE);
    const callOrder: string[] = [];
    mocks.upload.mockImplementation(async () => {
      callOrder.push("upload");
      return { key: SANITIZED_STORAGE_KEY };
    });
    mocks.updateStorageKey.mockImplementation(async () => {
      callOrder.push("updateStorageKey");
      return { ...BASE_INVOICE, storageKey: SANITIZED_STORAGE_KEY };
    });

    await generateInvoicePdf("tenant-1", "inv-1", { includeGst: false }, CONTEXT);

    expect(mocks.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "platform-invoices",
        key: SANITIZED_STORAGE_KEY,
        contentType: "application/pdf",
      })
    );
    expect(callOrder).toEqual(["upload", "updateStorageKey"]);
    expect(mocks.recordPlatformAudit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "tenant-1", action: "INVOICE_PDF_GENERATED", entityType: "SubscriptionInvoice" })
    );
    expect(mocks.toSubscriptionInvoiceDTO).toHaveBeenCalled();
  });

  it("deletes the uploaded file when persisting the storage key fails, and rethrows the original error", async () => {
    mocks.findById.mockResolvedValue(BASE_INVOICE);
    const dbError = new Error("db write failed");
    mocks.updateStorageKey.mockRejectedValue(dbError);
    mocks.delete.mockResolvedValue(undefined);

    await expect(generateInvoicePdf("tenant-1", "inv-1", { includeGst: false }, CONTEXT)).rejects.toThrow(dbError);

    expect(mocks.delete).toHaveBeenCalledWith("platform-invoices", SANITIZED_STORAGE_KEY);
    expect(mocks.recordPlatformAudit).not.toHaveBeenCalled();
  });

  it("does not let a cleanup failure mask the original database error", async () => {
    mocks.findById.mockResolvedValue(BASE_INVOICE);
    const dbError = new Error("db write failed");
    mocks.updateStorageKey.mockRejectedValue(dbError);
    mocks.delete.mockRejectedValue(new Error("storage delete also failed"));

    await expect(generateInvoicePdf("tenant-1", "inv-1", { includeGst: false }, CONTEXT)).rejects.toThrow(dbError);
  });
});
