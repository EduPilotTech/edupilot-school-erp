import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findByTenant: vi.fn(),
}));

vi.mock("../infrastructure/prisma-payment.repository", () => ({
  PrismaPaymentRepository: class {
    findByTenant = mocks.findByTenant;
  },
}));

vi.mock("./payment.service", () => ({
  toPaymentDTO: (entity: Record<string, unknown>) => ({ ...entity, __dto: true }),
}));

import { getPaymentHistory, getRefundHistory } from "./get-payment-history.service";
import type { PaymentEntity } from "../domain/payment.entity";

function payment(overrides: Partial<PaymentEntity>): PaymentEntity {
  return {
    id: "pay-1",
    tenantId: "tenant-1",
    subscriptionInvoiceId: "inv-1",
    gatewayProvider: "RAZORPAY",
    gatewayOrderId: "order_1",
    gatewayPaymentId: "pay_gw_1",
    amount: 1000,
    currency: "INR",
    status: "CAPTURED",
    method: "upi",
    gatewayResponseSnapshot: null,
    failureReason: null,
    refundedAmount: 0,
    capturedAt: new Date("2026-08-01"),
    refundedAt: null,
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

describe("get-payment-history.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPaymentHistory", () => {
    it("returns every payment for the tenant regardless of refund status", async () => {
      const payments = [
        payment({ id: "pay-captured", refundedAmount: 0 }),
        payment({ id: "pay-partial-refund", status: "PARTIALLY_REFUNDED", refundedAmount: 200 }),
        payment({ id: "pay-full-refund", status: "REFUNDED", refundedAmount: 1000 }),
        payment({ id: "pay-failed", status: "FAILED", refundedAmount: 0 }),
      ];
      mocks.findByTenant.mockResolvedValue(payments);

      const result = await getPaymentHistory("tenant-1");

      expect(mocks.findByTenant).toHaveBeenCalledWith("tenant-1");
      expect(result).toHaveLength(4);
    });
  });

  describe("getRefundHistory", () => {
    it("returns only rows with refundedAmount > 0, covering both partial and full refunds", async () => {
      const payments = [
        payment({ id: "pay-no-refund", refundedAmount: 0 }),
        payment({ id: "pay-partial-refund", status: "PARTIALLY_REFUNDED", refundedAmount: 200 }),
        payment({ id: "pay-full-refund", status: "REFUNDED", refundedAmount: 1000 }),
        payment({ id: "pay-failed-no-refund", status: "FAILED", refundedAmount: 0 }),
      ];
      mocks.findByTenant.mockResolvedValue(payments);

      const result = await getRefundHistory("tenant-1");

      expect(result.map((r) => (r as { id: string }).id).sort()).toEqual(["pay-full-refund", "pay-partial-refund"].sort());
    });

    it("relies on the refundedAmount running total, not the status enum alone", async () => {
      // A CAPTURED-status payment (not yet flipped to PARTIALLY_REFUNDED/REFUNDED) with a nonzero
      // refundedAmount should still surface — the running total is the source of truth.
      mocks.findByTenant.mockResolvedValue([payment({ id: "pay-inconsistent-status", status: "CAPTURED", refundedAmount: 50 })]);

      const result = await getRefundHistory("tenant-1");

      expect(result.map((r) => (r as { id: string }).id)).toEqual(["pay-inconsistent-status"]);
    });

    it("returns an empty array when no payments have been refunded", async () => {
      mocks.findByTenant.mockResolvedValue([payment({ id: "pay-1", refundedAmount: 0 })]);

      const result = await getRefundHistory("tenant-1");

      expect(result).toEqual([]);
    });
  });
});
