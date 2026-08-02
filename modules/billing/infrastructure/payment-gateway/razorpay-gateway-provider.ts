// Bundle B — Razorpay implementation of PaymentGatewayProvider. Wraps the official `razorpay`
// npm package's SDK calls and maps its responses to this module's own plain return shapes — the
// SDK's own response types (Orders.RazorpayOrder, Payments.RazorpayPayment, etc.) never leak
// past this one file; every other file in this codebase depends on
// payment-gateway-provider.interface.ts instead.
import "server-only";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";
import { getRazorpayKeyId, getRazorpayKeySecret } from "./razorpay-env";
import type {
  CaptureGatewayPaymentResult,
  CreateGatewayOrderInput,
  CreateGatewayOrderResult,
  CreateGatewayRefundResult,
  FetchGatewayPaymentResult,
  PaymentGatewayProvider,
} from "./payment-gateway-provider.interface";

// Compares two hex-encoded digests in constant time, returning false (rather than throwing) when
// lengths differ — same discipline as webhook-signature.helpers.ts's own comparison, duplicated
// here rather than imported because that file intentionally has zero imports beyond `crypto`.
function timingSafeHexEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

export class RazorpayGatewayProvider implements PaymentGatewayProvider {
  private readonly client: Razorpay;

  constructor() {
    this.client = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
  }

  async createOrder(input: CreateGatewayOrderInput): Promise<CreateGatewayOrderResult> {
    const order = await this.client.orders.create({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    });

    return {
      gatewayOrderId: order.id,
      amount: typeof order.amount === "string" ? Number(order.amount) : order.amount,
      currency: order.currency,
      status: order.status,
    };
  }

  async capturePayment(
    gatewayPaymentId: string,
    amount: number,
    currency: string
  ): Promise<CaptureGatewayPaymentResult> {
    const payment = await this.client.payments.capture(gatewayPaymentId, amount, currency);

    return {
      gatewayPaymentId: payment.id,
      status: payment.status,
      method: payment.method ?? null,
    };
  }

  async createRefund(gatewayPaymentId: string, amount: number): Promise<CreateGatewayRefundResult> {
    const refund = await this.client.payments.refund(gatewayPaymentId, { amount });

    return {
      gatewayRefundId: refund.id,
      // The SDK's own RazorpayRefund.amount is optional in its response type, though Razorpay
      // always returns it in practice — fall back to the requested amount rather than `0` so a
      // gap in the SDK's typing can never silently zero out a refund amount downstream.
      amount: refund.amount ?? amount,
      status: refund.status,
    };
  }

  async fetchPayment(gatewayPaymentId: string): Promise<FetchGatewayPaymentResult> {
    const payment = await this.client.payments.fetch(gatewayPaymentId);

    return {
      gatewayPaymentId: payment.id,
      gatewayOrderId: payment.order_id,
      amount: typeof payment.amount === "string" ? Number(payment.amount) : payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method ?? null,
    };
  }

  // First-pass trust signal only — see payment-gateway-provider.interface.ts's own doc comment
  // on why the webhook remains authoritative regardless of this check's result.
  verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
    const expectedSignature = createHmac("sha256", getRazorpayKeySecret())
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return timingSafeHexEqual(expectedSignature, signature);
  }
}
