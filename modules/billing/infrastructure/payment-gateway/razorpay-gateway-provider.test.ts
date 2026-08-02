import { createHmac } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` throws unconditionally when imported outside the "react-server" resolve
// condition (see node_modules/server-only/index.js) — Vitest doesn't set that condition, so the
// marker import in razorpay-gateway-provider.ts must be neutralized here, exactly as it would be
// by Next.js's own bundler in a real server context.
vi.mock("server-only", () => ({}));

// Mock functions (and a real class wrapping them, so `new Razorpay(...)` in the source under
// test behaves exactly like construction, not a bare function call) are created via vi.hoisted
// so the vi.mock factory below (itself hoisted above all imports by Vitest) can reference them
// without a temporal-dead-zone error.
const mocks = vi.hoisted(() => {
  const ordersCreate = vi.fn();
  const paymentsCapture = vi.fn();
  const paymentsRefund = vi.fn();
  const paymentsFetch = vi.fn();

  class MockRazorpayClient {
    orders = { create: ordersCreate };
    payments = { capture: paymentsCapture, refund: paymentsRefund, fetch: paymentsFetch };
  }

  return { ordersCreate, paymentsCapture, paymentsRefund, paymentsFetch, MockRazorpayClient };
});

// No real network call ever happens — the `razorpay` SDK's constructor and every method used by
// RazorpayGatewayProvider are replaced with test doubles.
vi.mock("razorpay", () => ({
  default: mocks.MockRazorpayClient,
}));

const KEY_ID = "rzp_test_key_id";
const KEY_SECRET = "rzp_test_key_secret_value";

describe("RazorpayGatewayProvider", () => {
  beforeEach(async () => {
    process.env.RAZORPAY_KEY_ID = KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
    mocks.ordersCreate.mockReset();
    mocks.paymentsCapture.mockReset();
    mocks.paymentsRefund.mockReset();
    mocks.paymentsFetch.mockReset();
  });

  it("createOrder calls orders.create with correctly-shaped args and maps the SDK response", async () => {
    mocks.ordersCreate.mockResolvedValue({
      id: "order_ABC123",
      entity: "order",
      amount: 4999,
      amount_paid: 0,
      amount_due: 4999,
      currency: "INR",
      receipt: "receipt_1",
      status: "created",
      attempts: 0,
      created_at: 1700000000,
    });

    const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
    const provider = new RazorpayGatewayProvider();

    const result = await provider.createOrder({
      amount: 4999,
      currency: "INR",
      receipt: "receipt_1",
      notes: { subscriptionInvoiceId: "inv_1" },
    });

    expect(mocks.ordersCreate).toHaveBeenCalledWith({
      amount: 4999,
      currency: "INR",
      receipt: "receipt_1",
      notes: { subscriptionInvoiceId: "inv_1" },
    });
    expect(result).toEqual({
      gatewayOrderId: "order_ABC123",
      amount: 4999,
      currency: "INR",
      status: "created",
    });
  });

  it("createOrder coerces a string amount from the SDK to a number", async () => {
    mocks.ordersCreate.mockResolvedValue({
      id: "order_ABC123",
      amount: "4999",
      currency: "INR",
      status: "created",
    });

    const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
    const provider = new RazorpayGatewayProvider();

    const result = await provider.createOrder({ amount: 4999, currency: "INR", receipt: "receipt_1" });

    expect(result.amount).toBe(4999);
    expect(typeof result.amount).toBe("number");
  });

  it("capturePayment calls payments.capture with (paymentId, amount, currency) and maps the response", async () => {
    mocks.paymentsCapture.mockResolvedValue({
      id: "pay_XYZ789",
      entity: "payment",
      status: "captured",
      method: "card",
      order_id: "order_ABC123",
      amount: 4999,
      currency: "INR",
    });

    const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
    const provider = new RazorpayGatewayProvider();

    const result = await provider.capturePayment("pay_XYZ789", 4999, "INR");

    expect(mocks.paymentsCapture).toHaveBeenCalledWith("pay_XYZ789", 4999, "INR");
    expect(result).toEqual({
      gatewayPaymentId: "pay_XYZ789",
      status: "captured",
      method: "card",
    });
  });

  it("createRefund calls payments.refund with (paymentId, { amount }) and maps the response", async () => {
    mocks.paymentsRefund.mockResolvedValue({
      id: "rfnd_111222",
      entity: "refund",
      amount: 2000,
      currency: "INR",
      payment_id: "pay_XYZ789",
      status: "processed",
      created_at: 1700000000,
    });

    const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
    const provider = new RazorpayGatewayProvider();

    const result = await provider.createRefund("pay_XYZ789", 2000);

    expect(mocks.paymentsRefund).toHaveBeenCalledWith("pay_XYZ789", { amount: 2000 });
    expect(result).toEqual({
      gatewayRefundId: "rfnd_111222",
      amount: 2000,
      status: "processed",
    });
  });

  it("fetchPayment calls payments.fetch with the payment id and maps the response", async () => {
    mocks.paymentsFetch.mockResolvedValue({
      id: "pay_XYZ789",
      entity: "payment",
      order_id: "order_ABC123",
      amount: 4999,
      currency: "INR",
      status: "captured",
      method: "upi",
    });

    const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
    const provider = new RazorpayGatewayProvider();

    const result = await provider.fetchPayment("pay_XYZ789");

    expect(mocks.paymentsFetch).toHaveBeenCalledWith("pay_XYZ789");
    expect(result).toEqual({
      gatewayPaymentId: "pay_XYZ789",
      gatewayOrderId: "order_ABC123",
      amount: 4999,
      currency: "INR",
      status: "captured",
      method: "upi",
    });
  });

  describe("verifyCheckoutSignature", () => {
    // Real crypto, no mock needed — same discipline as webhook-signature.helpers.test.ts.
    function sign(orderId: string, paymentId: string, secret: string): string {
      return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    }

    it("accepts a validly-signed order/payment pair", async () => {
      const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
      const provider = new RazorpayGatewayProvider();
      const signature = sign("order_ABC123", "pay_XYZ789", KEY_SECRET);

      expect(provider.verifyCheckoutSignature("order_ABC123", "pay_XYZ789", signature)).toBe(true);
    });

    it("rejects a tampered payment id signed for a different payment", async () => {
      const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
      const provider = new RazorpayGatewayProvider();
      const signature = sign("order_ABC123", "pay_XYZ789", KEY_SECRET);

      expect(provider.verifyCheckoutSignature("order_ABC123", "pay_TAMPERED", signature)).toBe(false);
    });

    it("rejects a signature produced with the wrong key secret", async () => {
      const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
      const provider = new RazorpayGatewayProvider();
      const signature = sign("order_ABC123", "pay_XYZ789", "a-completely-different-secret");

      expect(provider.verifyCheckoutSignature("order_ABC123", "pay_XYZ789", signature)).toBe(false);
    });

    it("returns false without throwing for a wrong-length signature", async () => {
      const { RazorpayGatewayProvider } = await import("./razorpay-gateway-provider");
      const provider = new RazorpayGatewayProvider();

      expect(() => provider.verifyCheckoutSignature("order_ABC123", "pay_XYZ789", "short")).not.toThrow();
      expect(provider.verifyCheckoutSignature("order_ABC123", "pay_XYZ789", "short")).toBe(false);
    });
  });
});
