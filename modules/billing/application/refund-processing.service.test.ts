import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findByGatewayPaymentIdAnyTenant: vi.fn(),
  markProcessingResult: vi.fn(),
  getPayment: vi.fn(),
  refundPayment: vi.fn(),
}));

vi.mock("../infrastructure/prisma-payment.repository", () => ({
  PrismaPaymentRepository: class {
    findByGatewayPaymentIdAnyTenant = mocks.findByGatewayPaymentIdAnyTenant;
  },
}));

vi.mock("../infrastructure/prisma-webhook-event.repository", () => ({
  PrismaWebhookEventRepository: class {
    markProcessingResult = mocks.markProcessingResult;
  },
}));

vi.mock("./payment.service", () => ({
  getPayment: mocks.getPayment,
  refundPayment: mocks.refundPayment,
}));

import { ValidationError } from "@/lib/errors";
import { processRefundWebhookEvent } from "./refund-processing.service";

const RESOLVED_PAYMENT = { id: "pay-row-1", tenantId: "tenant-1" };

function payloadWith(entity: Record<string, unknown>) {
  return { payload: { refund: { entity } } };
}

describe("processRefundWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["refund.processed", "refund.created"])("refunds the payment for a %s event and marks the webhook PROCESSED", async (eventType) => {
    mocks.findByGatewayPaymentIdAnyTenant.mockResolvedValue(RESOLVED_PAYMENT);
    mocks.getPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, refundedAmount: 0 });
    mocks.refundPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, refundedAmount: 20 });
    mocks.markProcessingResult.mockResolvedValue({});

    const entity = { id: "rfnd_1", payment_id: "pay_1", amount: 2000, status: "processed" };
    await processRefundWebhookEvent({ webhookEventId: "evt-1", eventType, payload: payloadWith(entity) });

    expect(mocks.findByGatewayPaymentIdAnyTenant).toHaveBeenCalledWith("RAZORPAY", "pay_1");
    expect(mocks.refundPayment).toHaveBeenCalledWith(
      "pay-row-1",
      { refundAmount: 20 },
      { tenantId: "tenant-1", actingUserId: "system:razorpay-webhook" }
    );
    expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-1", { status: "PROCESSED", relatedPaymentId: "pay-row-1" });
  });

  it("converts the gateway's paise amount to rupees before calling refundPayment", async () => {
    mocks.findByGatewayPaymentIdAnyTenant.mockResolvedValue(RESOLVED_PAYMENT);
    mocks.getPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, refundedAmount: 0 });
    mocks.refundPayment.mockResolvedValue({});
    mocks.markProcessingResult.mockResolvedValue({});

    const entity = { id: "rfnd_1", payment_id: "pay_1", amount: 149900, status: "processed" };
    await processRefundWebhookEvent({ webhookEventId: "evt-1", eventType: "refund.processed", payload: payloadWith(entity) });

    expect(mocks.refundPayment).toHaveBeenCalledWith("pay-row-1", { refundAmount: 1499 }, expect.anything());
  });

  it("is a no-op (idempotent) when the payment's refundedAmount already covers this refund", async () => {
    mocks.findByGatewayPaymentIdAnyTenant.mockResolvedValue(RESOLVED_PAYMENT);
    mocks.getPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, refundedAmount: 20 });
    mocks.markProcessingResult.mockResolvedValue({});

    const entity = { id: "rfnd_1", payment_id: "pay_1", amount: 2000, status: "processed" };
    await processRefundWebhookEvent({ webhookEventId: "evt-1", eventType: "refund.processed", payload: payloadWith(entity) });

    expect(mocks.refundPayment).not.toHaveBeenCalled();
    expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-1", { status: "PROCESSED", relatedPaymentId: "pay-row-1" });
  });

  it("throws ValidationError instead of crashing on a payload missing required refund fields", async () => {
    await expect(
      processRefundWebhookEvent({ webhookEventId: "evt-1", eventType: "refund.processed", payload: { payload: {} } })
    ).rejects.toBeInstanceOf(ValidationError);

    expect(mocks.findByGatewayPaymentIdAnyTenant).not.toHaveBeenCalled();
  });

  it("throws ValidationError instead of crashing when the payload is not an object at all", async () => {
    await expect(
      processRefundWebhookEvent({ webhookEventId: "evt-1", eventType: "refund.processed", payload: null })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when no Payment is found for the gateway payment id", async () => {
    mocks.findByGatewayPaymentIdAnyTenant.mockResolvedValue(null);

    const entity = { id: "rfnd_1", payment_id: "pay_missing", amount: 2000, status: "processed" };
    await expect(
      processRefundWebhookEvent({ webhookEventId: "evt-1", eventType: "refund.processed", payload: payloadWith(entity) })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("acknowledges an unrecognized refund.* sub-type as a harmless no-op", async () => {
    mocks.markProcessingResult.mockResolvedValue({});

    await processRefundWebhookEvent({ webhookEventId: "evt-1", eventType: "refund.speed_changed", payload: {} });

    expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-1", { status: "PROCESSED" });
    expect(mocks.findByGatewayPaymentIdAnyTenant).not.toHaveBeenCalled();
  });
});
