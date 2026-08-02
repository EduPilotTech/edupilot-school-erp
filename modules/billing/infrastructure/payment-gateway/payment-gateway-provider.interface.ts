// Bundle B — Payment gateway abstraction. Mirrors lib/storage/storage-service.ts's own
// "repository owns the persistence detail, service owns the business logic" separation, applied
// here to payment gateways: application code (payment.service.ts, and whatever later calls into
// it) depends on this interface only, never on the `razorpay` SDK's own request/response types or
// on any other gateway's SDK. A future PhonePe implementation (see
// PaymentGatewayProviderCodeValue in ../../domain/payment.entity.ts) implements this same
// interface without any application-layer change.
//
// Amounts here are in the gateway's smallest currency unit (e.g. paise for INR), matching how
// Razorpay's own API operates — callers convert to/from the rupee-denominated amounts stored on
// PaymentEntity at the call site, not inside this interface.

export interface CreateGatewayOrderInput {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreateGatewayOrderResult {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CaptureGatewayPaymentResult {
  gatewayPaymentId: string;
  status: string;
  method: string | null;
}

export interface CreateGatewayRefundResult {
  gatewayRefundId: string;
  amount: number;
  status: string;
}

export interface FetchGatewayPaymentResult {
  gatewayPaymentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
}

export interface PaymentGatewayProvider {
  createOrder(input: CreateGatewayOrderInput): Promise<CreateGatewayOrderResult>;

  capturePayment(
    gatewayPaymentId: string,
    amount: number,
    currency: string
  ): Promise<CaptureGatewayPaymentResult>;

  createRefund(gatewayPaymentId: string, amount: number): Promise<CreateGatewayRefundResult>;

  fetchPayment(gatewayPaymentId: string): Promise<FetchGatewayPaymentResult>;

  // Verifies the signature Razorpay's client-side Checkout hands back after a successful
  // payment attempt (HMAC-SHA256 of `orderId + "|" + paymentId`, keyed with the Key Secret).
  // This is a FIRST-PASS trust signal only — a client can lie about ever calling this, or the
  // browser tab can be closed before it fires — so it is never sufficient on its own to mark a
  // payment captured. The webhook (see webhook-signature.helpers.ts) remains the authoritative
  // source of truth, per the approved Architecture Review.
  verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean;
}
