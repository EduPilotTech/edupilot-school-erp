import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findByGatewayOrderIdAnyTenant: vi.fn(),
  markProcessingResult: vi.fn(),
  subscriptionFindById: vi.fn(),
  getPayment: vi.fn(),
  markPaymentCaptured: vi.fn(),
  markPaymentFailed: vi.fn(),
  createSubscription: vi.fn(),
}));

vi.mock("../infrastructure/prisma-payment.repository", () => ({
  PrismaPaymentRepository: class {
    findByGatewayOrderIdAnyTenant = mocks.findByGatewayOrderIdAnyTenant;
  },
}));

vi.mock("../infrastructure/prisma-webhook-event.repository", () => ({
  PrismaWebhookEventRepository: class {
    markProcessingResult = mocks.markProcessingResult;
  },
}));

vi.mock("../infrastructure/prisma-subscription.repository", () => ({
  PrismaSubscriptionRepository: class {
    findById = mocks.subscriptionFindById;
  },
}));

vi.mock("./payment.service", () => ({
  getPayment: mocks.getPayment,
  markPaymentCaptured: mocks.markPaymentCaptured,
  markPaymentFailed: mocks.markPaymentFailed,
}));

vi.mock("./subscription.service", () => ({
  createSubscription: mocks.createSubscription,
}));

import { ValidationError } from "@/lib/errors";
import { SubscriptionNotFoundError } from "../domain/errors";
import { processPaymentWebhookEvent } from "./payment-processing.service";

const RESOLVED_PAYMENT = { id: "pay-row-1", tenantId: "tenant-1", status: "CREATED" };

describe("processPaymentWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("payment.captured", () => {
    function payloadWith(entity: Record<string, unknown>) {
      return { payload: { payment: { entity } } };
    }

    it("captures the payment and marks the webhook event PROCESSED with relatedPaymentId", async () => {
      mocks.findByGatewayOrderIdAnyTenant.mockResolvedValue(RESOLVED_PAYMENT);
      mocks.getPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, status: "CREATED" });
      mocks.markPaymentCaptured.mockResolvedValue({ ...RESOLVED_PAYMENT, status: "CAPTURED" });
      mocks.markProcessingResult.mockResolvedValue({});

      const entity = { id: "pay_1", order_id: "order_1", amount: 4999, currency: "INR", status: "captured", method: "upi" };
      await processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "payment.captured", payload: payloadWith(entity) });

      expect(mocks.findByGatewayOrderIdAnyTenant).toHaveBeenCalledWith("RAZORPAY", "order_1");
      expect(mocks.markPaymentCaptured).toHaveBeenCalledWith(
        "pay-row-1",
        { gatewayPaymentId: "pay_1", gatewayResponseSnapshot: entity },
        { tenantId: "tenant-1", actingUserId: "system:razorpay-webhook" }
      );
      expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-1", { status: "PROCESSED", relatedPaymentId: "pay-row-1" });
    });

    it("is a no-op (idempotent) when the payment is already CAPTURED", async () => {
      mocks.findByGatewayOrderIdAnyTenant.mockResolvedValue(RESOLVED_PAYMENT);
      mocks.getPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, status: "CAPTURED" });
      mocks.markProcessingResult.mockResolvedValue({});

      const entity = { id: "pay_1", order_id: "order_1", amount: 4999, currency: "INR", status: "captured" };
      await processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "payment.captured", payload: payloadWith(entity) });

      expect(mocks.markPaymentCaptured).not.toHaveBeenCalled();
      expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-1", { status: "PROCESSED", relatedPaymentId: "pay-row-1" });
    });

    it("throws ValidationError instead of crashing on a payload missing required fields", async () => {
      await expect(
        processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "payment.captured", payload: { payload: {} } })
      ).rejects.toBeInstanceOf(ValidationError);

      expect(mocks.findByGatewayOrderIdAnyTenant).not.toHaveBeenCalled();
    });

    it("throws ValidationError instead of crashing when the payload is not an object at all", async () => {
      await expect(
        processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "payment.captured", payload: "not-an-object" })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("payment.failed", () => {
    function payloadWith(entity: Record<string, unknown>) {
      return { payload: { payment: { entity } } };
    }

    it("marks the payment failed with the gateway's error_description", async () => {
      mocks.findByGatewayOrderIdAnyTenant.mockResolvedValue(RESOLVED_PAYMENT);
      mocks.getPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, status: "CREATED" });
      mocks.markPaymentFailed.mockResolvedValue({ ...RESOLVED_PAYMENT, status: "FAILED" });
      mocks.markProcessingResult.mockResolvedValue({});

      const entity = {
        id: "pay_1",
        order_id: "order_1",
        amount: 4999,
        currency: "INR",
        status: "failed",
        error_description: "Insufficient funds",
      };
      await processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "payment.failed", payload: payloadWith(entity) });

      expect(mocks.markPaymentFailed).toHaveBeenCalledWith(
        "pay-row-1",
        { failureReason: "Insufficient funds", gatewayResponseSnapshot: entity },
        { tenantId: "tenant-1", actingUserId: "system:razorpay-webhook" }
      );
    });

    it("falls back to a default failure reason when error_description is absent", async () => {
      mocks.findByGatewayOrderIdAnyTenant.mockResolvedValue(RESOLVED_PAYMENT);
      mocks.getPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, status: "CREATED" });
      mocks.markPaymentFailed.mockResolvedValue({ ...RESOLVED_PAYMENT, status: "FAILED" });
      mocks.markProcessingResult.mockResolvedValue({});

      const entity = { id: "pay_1", order_id: "order_1", amount: 4999, currency: "INR", status: "failed" };
      await processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "payment.failed", payload: payloadWith(entity) });

      expect(mocks.markPaymentFailed).toHaveBeenCalledWith(
        "pay-row-1",
        { failureReason: "Payment failed", gatewayResponseSnapshot: entity },
        expect.anything()
      );
    });

    it("is a no-op (idempotent) when the payment is already FAILED", async () => {
      mocks.findByGatewayOrderIdAnyTenant.mockResolvedValue(RESOLVED_PAYMENT);
      mocks.getPayment.mockResolvedValue({ ...RESOLVED_PAYMENT, status: "FAILED" });
      mocks.markProcessingResult.mockResolvedValue({});

      const entity = { id: "pay_1", order_id: "order_1", amount: 4999, currency: "INR", status: "failed" };
      await processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "payment.failed", payload: payloadWith(entity) });

      expect(mocks.markPaymentFailed).not.toHaveBeenCalled();
      expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-1", { status: "PROCESSED", relatedPaymentId: "pay-row-1" });
    });
  });

  describe("subscription.charged", () => {
    it("renews the subscription via createSubscription using the notes-derived tenant/subscription id", async () => {
      const currentPeriodEnd = new Date("2026-09-01T00:00:00.000Z");
      mocks.subscriptionFindById.mockResolvedValue({
        subscriptionPlanDefinitionId: "plan-1",
        billingCycle: "MONTHLY",
        currentPeriodEnd,
        autoRenew: true,
      });
      mocks.createSubscription.mockResolvedValue({});
      mocks.markProcessingResult.mockResolvedValue({});

      const payload = {
        payload: {
          payment: {
            entity: { id: "pay_1", notes: { tenantId: "tenant-1", subscriptionId: "sub-1" } },
          },
        },
      };
      await processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "subscription.charged", payload });

      expect(mocks.subscriptionFindById).toHaveBeenCalledWith("tenant-1", "sub-1");
      expect(mocks.createSubscription).toHaveBeenCalledWith(
        { subscriptionPlanDefinitionId: "plan-1", billingCycle: "MONTHLY", effectiveFrom: currentPeriodEnd, autoRenew: true },
        { tenantId: "tenant-1", actingUserId: "system:razorpay-webhook" }
      );
      expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-1", { status: "PROCESSED" });
    });

    it("throws SubscriptionNotFoundError when the notes-derived subscription cannot be resolved", async () => {
      mocks.subscriptionFindById.mockResolvedValue(null);
      const payload = { payload: { payment: { entity: { notes: { tenantId: "tenant-1", subscriptionId: "sub-missing" } } } } };

      await expect(
        processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "subscription.charged", payload })
      ).rejects.toBeInstanceOf(SubscriptionNotFoundError);
    });

    it("throws ValidationError when notes are missing from the payload", async () => {
      const payload = { payload: { payment: { entity: {} } } };

      await expect(
        processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "subscription.charged", payload })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  it("acknowledges an unrecognized payment.*/subscription.* sub-type as a harmless no-op", async () => {
    mocks.markProcessingResult.mockResolvedValue({});

    await processPaymentWebhookEvent({ webhookEventId: "evt-1", eventType: "payment.dispute.created", payload: {} });

    expect(mocks.markProcessingResult).toHaveBeenCalledWith("evt-1", { status: "PROCESSED" });
    expect(mocks.findByGatewayOrderIdAnyTenant).not.toHaveBeenCalled();
  });
});
