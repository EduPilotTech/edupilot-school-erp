import { describe, expect, it } from "vitest";
import {
  initiatePaymentSchema,
  markPaymentCapturedSchema,
  markPaymentFailedSchema,
  refundPaymentSchema,
} from "./payment.dto";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("initiatePaymentSchema", () => {
  it("accepts a valid Razorpay order", () => {
    const result = initiatePaymentSchema.safeParse({
      subscriptionInvoiceId: VALID_UUID,
      gatewayProvider: "RAZORPAY",
      gatewayOrderId: "order_ABC123",
      amount: 4999,
      currency: "INR",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown gateway provider", () => {
    const result = initiatePaymentSchema.safeParse({
      subscriptionInvoiceId: VALID_UUID,
      gatewayProvider: "STRIPE",
      gatewayOrderId: "order_ABC123",
      amount: 4999,
      currency: "INR",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero amount", () => {
    const result = initiatePaymentSchema.safeParse({
      subscriptionInvoiceId: VALID_UUID,
      gatewayProvider: "RAZORPAY",
      gatewayOrderId: "order_ABC123",
      amount: 0,
      currency: "INR",
    });
    expect(result.success).toBe(false);
  });
});

describe("markPaymentCapturedSchema", () => {
  it("accepts a valid gateway payment id", () => {
    expect(markPaymentCapturedSchema.safeParse({ gatewayPaymentId: "pay_XYZ" }).success).toBe(true);
  });

  it("rejects an empty gateway payment id", () => {
    expect(markPaymentCapturedSchema.safeParse({ gatewayPaymentId: "" }).success).toBe(false);
  });
});

describe("markPaymentFailedSchema", () => {
  it("accepts a valid failure reason", () => {
    expect(markPaymentFailedSchema.safeParse({ failureReason: "Card declined." }).success).toBe(true);
  });

  it("rejects an empty failure reason", () => {
    expect(markPaymentFailedSchema.safeParse({ failureReason: "" }).success).toBe(false);
  });
});

describe("refundPaymentSchema", () => {
  it("accepts a positive refund amount", () => {
    expect(refundPaymentSchema.safeParse({ refundAmount: 100 }).success).toBe(true);
  });

  it("rejects a non-positive refund amount", () => {
    expect(refundPaymentSchema.safeParse({ refundAmount: 0 }).success).toBe(false);
  });
});
