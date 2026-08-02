import { beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` throws unconditionally when imported outside the "react-server" resolve
// condition — Vitest doesn't set that condition, so it must be neutralized here exactly as in
// razorpay-gateway-provider.test.ts.
vi.mock("server-only", () => ({}));

// Mock functions created via vi.hoisted so the vi.mock factories below (themselves hoisted above
// all imports by Vitest) can reference them without a temporal-dead-zone error — same discipline
// as razorpay-gateway-provider.test.ts's own `mocks` object.
const mocks = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  isWebhookTimestampFresh: vi.fn(),
  deriveWebhookIdempotencyKey: vi.fn(),
  getRazorpayWebhookSecret: vi.fn(() => "whsec_test_secret"),
  markProcessingResult: vi.fn(),
  recordWebhookEvent: vi.fn(),
  getWebhookEvent: vi.fn(),
  processPaymentWebhookEvent: vi.fn(),
  processRefundWebhookEvent: vi.fn(),
}));

vi.mock("../infrastructure/payment-gateway/webhook-signature.helpers", () => ({
  verifyWebhookSignature: mocks.verifyWebhookSignature,
  isWebhookTimestampFresh: mocks.isWebhookTimestampFresh,
  deriveWebhookIdempotencyKey: mocks.deriveWebhookIdempotencyKey,
}));

vi.mock("../infrastructure/payment-gateway/razorpay-env", () => ({
  getRazorpayWebhookSecret: mocks.getRazorpayWebhookSecret,
}));

vi.mock("../infrastructure/prisma-webhook-event.repository", () => ({
  PrismaWebhookEventRepository: class {
    markProcessingResult = mocks.markProcessingResult;
  },
}));

vi.mock("./webhook-event.service", () => ({
  recordWebhookEvent: mocks.recordWebhookEvent,
  getWebhookEvent: mocks.getWebhookEvent,
}));

vi.mock("./payment-processing.service", () => ({
  processPaymentWebhookEvent: mocks.processPaymentWebhookEvent,
}));

vi.mock("./refund-processing.service", () => ({
  processRefundWebhookEvent: mocks.processRefundWebhookEvent,
}));

import { WebhookSignatureInvalidError } from "../domain/errors";
import { ingestRazorpayWebhook } from "./webhook-processing.service";
import type { WebhookEventDTO } from "./dto/webhook-event.dto";

const CONTEXT = { actingUserId: null };

function makeEvent(overrides: Partial<WebhookEventDTO> = {}): WebhookEventDTO {
  return {
    id: "evt-row-1",
    gatewayProvider: "RAZORPAY",
    eventType: "payment.captured",
    gatewayEventId: "evt_ABC123",
    signatureVerified: true,
    status: "RECEIVED",
    processingError: null,
    receivedAt: new Date().toISOString(),
    ...overrides,
  };
}

const RAW_BODY = JSON.stringify({
  entity: "event",
  event: "payment.captured",
  created_at: 1700000000,
  payload: { payment: { entity: { id: "pay_1", order_id: "order_1", amount: 4999, currency: "INR", status: "captured" } } },
});

describe("ingestRazorpayWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRazorpayWebhookSecret.mockReturnValue("whsec_test_secret");
    mocks.deriveWebhookIdempotencyKey.mockReturnValue("evt_ABC123");
  });

  it("dispatches to the payment processor for a valid signature and a fresh timestamp", async () => {
    mocks.verifyWebhookSignature.mockReturnValue(true);
    mocks.isWebhookTimestampFresh.mockReturnValue(true);
    mocks.recordWebhookEvent.mockResolvedValue(makeEvent({ status: "RECEIVED" }));
    mocks.processPaymentWebhookEvent.mockResolvedValue(undefined);
    mocks.getWebhookEvent.mockResolvedValue(makeEvent({ status: "PROCESSED" }));

    const result = await ingestRazorpayWebhook({ rawBody: RAW_BODY, signatureHeader: "sig", headerEventId: "evt_ABC123" }, CONTEXT);

    expect(mocks.recordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({ gatewayProvider: "RAZORPAY", eventType: "payment.captured", signatureVerified: true }),
      CONTEXT
    );
    expect(mocks.processPaymentWebhookEvent).toHaveBeenCalledWith({
      webhookEventId: "evt-row-1",
      eventType: "payment.captured",
      payload: expect.objectContaining({ event: "payment.captured" }),
    });
    expect(mocks.processRefundWebhookEvent).not.toHaveBeenCalled();
    expect(result.status).toBe("PROCESSED");
  });

  it("throws WebhookSignatureInvalidError and never calls recordWebhookEvent when the signature is invalid", async () => {
    mocks.verifyWebhookSignature.mockReturnValue(false);

    await expect(
      ingestRazorpayWebhook({ rawBody: RAW_BODY, signatureHeader: "bad-sig", headerEventId: "evt_ABC123" }, CONTEXT)
    ).rejects.toBeInstanceOf(WebhookSignatureInvalidError);

    expect(mocks.recordWebhookEvent).not.toHaveBeenCalled();
    expect(mocks.processPaymentWebhookEvent).not.toHaveBeenCalled();
    expect(mocks.processRefundWebhookEvent).not.toHaveBeenCalled();
  });

  it("records a stale-timestamp event as IGNORED (signatureVerified: false) and never dispatches", async () => {
    mocks.verifyWebhookSignature.mockReturnValue(true);
    mocks.isWebhookTimestampFresh.mockReturnValue(false);
    mocks.recordWebhookEvent.mockResolvedValue(makeEvent({ status: "IGNORED", signatureVerified: false }));

    const result = await ingestRazorpayWebhook({ rawBody: RAW_BODY, signatureHeader: "sig", headerEventId: "evt_ABC123" }, CONTEXT);

    expect(mocks.recordWebhookEvent).toHaveBeenCalledWith(expect.objectContaining({ signatureVerified: false }), CONTEXT);
    expect(mocks.processPaymentWebhookEvent).not.toHaveBeenCalled();
    expect(mocks.processRefundWebhookEvent).not.toHaveBeenCalled();
    expect(result.status).toBe("IGNORED");
  });

  it("does not re-dispatch a redelivered event that is already resolved (e.g. PROCESSED)", async () => {
    mocks.verifyWebhookSignature.mockReturnValue(true);
    mocks.isWebhookTimestampFresh.mockReturnValue(true);
    mocks.recordWebhookEvent.mockResolvedValue(makeEvent({ status: "PROCESSED" }));

    const result = await ingestRazorpayWebhook({ rawBody: RAW_BODY, signatureHeader: "sig", headerEventId: "evt_ABC123" }, CONTEXT);

    expect(mocks.processPaymentWebhookEvent).not.toHaveBeenCalled();
    expect(mocks.processRefundWebhookEvent).not.toHaveBeenCalled();
    expect(mocks.markProcessingResult).not.toHaveBeenCalled();
    expect(result.status).toBe("PROCESSED");
  });

  it("marks the event FAILED with the captured error message when the dispatched processor throws, and still returns normally", async () => {
    mocks.verifyWebhookSignature.mockReturnValue(true);
    mocks.isWebhookTimestampFresh.mockReturnValue(true);
    mocks.recordWebhookEvent.mockResolvedValue(makeEvent({ status: "RECEIVED" }));
    mocks.processPaymentWebhookEvent.mockRejectedValue(new Error("boom: gateway payment not found"));
    mocks.markProcessingResult.mockResolvedValue(makeEvent({ status: "FAILED", processingError: "boom: gateway payment not found" }));
    mocks.getWebhookEvent.mockResolvedValue(makeEvent({ status: "FAILED", processingError: "boom: gateway payment not found" }));

    const result = await ingestRazorpayWebhook({ rawBody: RAW_BODY, signatureHeader: "sig", headerEventId: "evt_ABC123" }, CONTEXT);

    expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-row-1", {
      status: "FAILED",
      processingError: "boom: gateway payment not found",
    });
    expect(result.status).toBe("FAILED");
    expect(result.processingError).toBe("boom: gateway payment not found");
  });

  it("dispatches refund.* events to the refund processor", async () => {
    const refundBody = JSON.stringify({
      entity: "event",
      event: "refund.processed",
      created_at: 1700000000,
      payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_1", amount: 2000, status: "processed" } } },
    });
    mocks.verifyWebhookSignature.mockReturnValue(true);
    mocks.isWebhookTimestampFresh.mockReturnValue(true);
    mocks.deriveWebhookIdempotencyKey.mockReturnValue("evt_REFUND1");
    mocks.recordWebhookEvent.mockResolvedValue(makeEvent({ id: "evt-row-2", eventType: "refund.processed", status: "RECEIVED" }));
    mocks.processRefundWebhookEvent.mockResolvedValue(undefined);
    mocks.getWebhookEvent.mockResolvedValue(makeEvent({ id: "evt-row-2", eventType: "refund.processed", status: "PROCESSED" }));

    await ingestRazorpayWebhook({ rawBody: refundBody, signatureHeader: "sig", headerEventId: "evt_REFUND1" }, CONTEXT);

    expect(mocks.processRefundWebhookEvent).toHaveBeenCalledWith({
      webhookEventId: "evt-row-2",
      eventType: "refund.processed",
      payload: expect.objectContaining({ event: "refund.processed" }),
    });
    expect(mocks.processPaymentWebhookEvent).not.toHaveBeenCalled();
  });
});
