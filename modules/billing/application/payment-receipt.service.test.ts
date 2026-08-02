import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getPayment: vi.fn(),
  getSubscriptionInvoice: vi.fn(),
}));

vi.mock("./payment.service", () => ({
  getPayment: mocks.getPayment,
}));

vi.mock("./generate-subscription-invoice.service", () => ({
  getSubscriptionInvoice: mocks.getSubscriptionInvoice,
}));

vi.mock("../infrastructure/platform-billing-identity.env", () => ({
  getPlatformCompanyName: () => "EduPilot Technologies Pvt Ltd",
  getPlatformCompanyAddress: () => "123 Tech Park, Bengaluru, Karnataka, India",
  getPlatformGstin: () => "29ABCDE1234F1Z5",
}));

import { InvalidPaymentTransitionError } from "../domain/errors";
import { generatePaymentReceipt } from "./payment-receipt.service";

const BILL_TO = { schoolName: "Greenwood High", address: "45 MG Road, Bengaluru" };

const BASE_PAYMENT = {
  id: "pay-1",
  tenantId: "tenant-1",
  subscriptionInvoiceId: "inv-1",
  gatewayProvider: "RAZORPAY" as const,
  gatewayOrderId: "order_1",
  gatewayPaymentId: "pay_gw_1",
  amount: 1000,
  currency: "INR",
  status: "CAPTURED" as const,
  method: "upi",
  failureReason: null,
  refundedAmount: 0,
  capturedAt: "2026-08-01T10:00:00.000Z",
  refundedAt: null,
};

const BASE_INVOICE = {
  id: "inv-1",
  tenantId: "tenant-1",
  subscriptionId: "sub-1",
  billingRunId: null,
  invoiceNumber: "INV/2025-26/0001",
  billingPeriod: "2026-08",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-31",
  planAtInvoice: "STANDARD",
  amount: 1000,
  taxAmount: 0,
  totalAmount: 1000,
  currency: "INR",
  status: "PAID",
  issuedAt: "2026-08-01T00:00:00.000Z",
  dueDate: "2026-08-15",
  paidAt: "2026-08-01T10:00:00.000Z",
};

describe("generatePaymentReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSubscriptionInvoice.mockResolvedValue(BASE_INVOICE);
  });

  it("renders a valid, non-empty PDF buffer for a CAPTURED payment", async () => {
    mocks.getPayment.mockResolvedValue(BASE_PAYMENT);

    const buffer = await generatePaymentReceipt("tenant-1", "pay-1", BILL_TO);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    // A valid PDF starts with the %PDF- magic bytes.
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("throws InvalidPaymentTransitionError for a CREATED-status payment", async () => {
    mocks.getPayment.mockResolvedValue({ ...BASE_PAYMENT, status: "CREATED", capturedAt: null });

    await expect(generatePaymentReceipt("tenant-1", "pay-1", BILL_TO)).rejects.toBeInstanceOf(InvalidPaymentTransitionError);
    expect(mocks.getSubscriptionInvoice).not.toHaveBeenCalled();
  });

  it("throws InvalidPaymentTransitionError for an AUTHORIZED-status payment", async () => {
    mocks.getPayment.mockResolvedValue({ ...BASE_PAYMENT, status: "AUTHORIZED", capturedAt: null });

    await expect(generatePaymentReceipt("tenant-1", "pay-1", BILL_TO)).rejects.toBeInstanceOf(InvalidPaymentTransitionError);
  });

  it("throws InvalidPaymentTransitionError for a FAILED-status payment", async () => {
    mocks.getPayment.mockResolvedValue({ ...BASE_PAYMENT, status: "FAILED", capturedAt: null });

    await expect(generatePaymentReceipt("tenant-1", "pay-1", BILL_TO)).rejects.toBeInstanceOf(InvalidPaymentTransitionError);
  });

  it("renders successfully for a PARTIALLY_REFUNDED payment", async () => {
    mocks.getPayment.mockResolvedValue({ ...BASE_PAYMENT, status: "PARTIALLY_REFUNDED", refundedAmount: 200 });

    const buffer = await generatePaymentReceipt("tenant-1", "pay-1", BILL_TO);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("renders a larger/different buffer when a refund line is included vs. a plain captured receipt", async () => {
    mocks.getPayment.mockResolvedValue(BASE_PAYMENT);
    const plainBuffer = await generatePaymentReceipt("tenant-1", "pay-1", BILL_TO);

    mocks.getPayment.mockResolvedValue({ ...BASE_PAYMENT, status: "REFUNDED", refundedAmount: 1000 });
    const refundedBuffer = await generatePaymentReceipt("tenant-1", "pay-1", BILL_TO);

    expect(Buffer.isBuffer(refundedBuffer)).toBe(true);
    expect(refundedBuffer.length).toBeGreaterThan(0);
    expect(refundedBuffer.equals(plainBuffer)).toBe(false);
  });
});
