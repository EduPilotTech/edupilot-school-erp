import "server-only";
import { PrismaSubscriptionInvoiceRepository } from "../infrastructure/prisma-subscription-invoice.repository";
import { RazorpayGatewayProvider } from "../infrastructure/payment-gateway/razorpay-gateway-provider";
import { getRazorpayKeyId } from "../infrastructure/payment-gateway/razorpay-env";
import { InvalidPaymentTransitionError, SubscriptionInvoiceNotFoundError } from "../domain/errors";
import { getPayment, initiatePayment, listPaymentsForInvoice, markPaymentCaptured, refundPayment } from "./payment.service";
import type { PaymentDTO } from "./dto/payment.dto";
import type { BillingContext } from "./billing-context";

// Bundle B, Step 1 — application-layer orchestration wrapping RazorpayGatewayProvider + the
// already-frozen payment services. This file is the SOLE caller of RazorpayGatewayProvider in
// the entire codebase — every other file depends on PaymentGatewayProvider's own interface (via
// payment.service.ts's persisted results) or, for the future checkout UI, on the plain
// {gatewayOrderId, keyId} shape these functions return.
//
// A fresh RazorpayGatewayProvider is constructed inside each function rather than held as a
// module-level singleton, deliberately: its constructor reads RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET
// eagerly and throws if either is missing (see razorpay-env.ts), so a module-level `new
// RazorpayGatewayProvider()` would make merely *importing* this file fail in any environment
// (including a test run) that hasn't configured those variables yet, even for a code path that
// never touches Razorpay. Lazy construction confines that requirement to the moment a Razorpay
// call is actually made — mirroring how razorpay-gateway-provider.test.ts itself always
// constructs a fresh instance per test after setting the env vars it needs.
function getGatewayProvider(): RazorpayGatewayProvider {
  return new RazorpayGatewayProvider();
}

const invoiceRepository = new PrismaSubscriptionInvoiceRepository();

// A Payment status still "in flight" at the gateway — see payment-transition.helpers.ts's own
// ALLOWED_TRANSITIONS table: CREATED and AUTHORIZED are the only two non-terminal states a
// Payment can be in before settling to CAPTURED/FAILED/REFUNDED.
const NON_TERMINAL_PAYMENT_STATUSES = new Set(["CREATED", "AUTHORIZED"]);

export interface CreateRazorpayOrderResult {
  payment: PaymentDTO;
  gatewayOrderId: string;
  keyId: string;
}

// Opens a Razorpay order against a SubscriptionInvoice and records the corresponding Payment row.
// Guards against double-ordering ("don't double-click checkout") by reusing any already-open
// (non-terminal) Payment for this invoice rather than creating a second gateway order — this is a
// DIFFERENT idempotency guarantee than the webhook's own (gatewayProvider, gatewayEventId)
// dedupe: this one exists so a user re-opening the checkout page for the same unpaid invoice
// doesn't fragment into multiple concurrent Razorpay orders.
export async function createRazorpayOrder(
  tenantId: string,
  subscriptionInvoiceId: string,
  context: BillingContext
): Promise<CreateRazorpayOrderResult> {
  const invoice = await invoiceRepository.findById(tenantId, subscriptionInvoiceId);
  if (!invoice) {
    throw new SubscriptionInvoiceNotFoundError();
  }

  const existingPayments = await listPaymentsForInvoice(tenantId, subscriptionInvoiceId);
  const openPayment = existingPayments.find((payment) => NON_TERMINAL_PAYMENT_STATUSES.has(payment.status));
  if (openPayment) {
    return { payment: openPayment, gatewayOrderId: openPayment.gatewayOrderId, keyId: getRazorpayKeyId() };
  }

  const gatewayProvider = getGatewayProvider();
  // Amounts are rupees on our own entities, paise at the gateway — convert at this call site only
  // (see payment-gateway-provider.interface.ts's own header comment). `notes` carries
  // {tenantId, subscriptionId} so a later `subscription.charged` webhook (see
  // payment-processing.service.ts) can resolve which tenant/subscription the renewal is for —
  // Razorpay echoes `notes` back verbatim on every event derived from this order.
  const order = await gatewayProvider.createOrder({
    amount: Math.round(invoice.totalAmount * 100),
    currency: invoice.currency,
    receipt: invoice.invoiceNumber,
    notes: { tenantId, subscriptionId: invoice.subscriptionId },
  });

  const payment = await initiatePayment(
    {
      subscriptionInvoiceId,
      gatewayProvider: "RAZORPAY",
      gatewayOrderId: order.gatewayOrderId,
      // Rupee amount here, not paise — initiatePaymentSchema stores the same rupee-denominated
      // amount every other Payment field uses.
      amount: invoice.totalAmount,
      currency: invoice.currency,
    },
    context
  );

  return { payment, gatewayOrderId: order.gatewayOrderId, keyId: getRazorpayKeyId() };
}

// The manual/explicit-capture path, for a Razorpay account configured WITHOUT auto-capture. The
// more common path in production is the webhook-driven one (payment-processing.service.ts's
// `payment.captured` handler) — both exist because "Capture Payment" is its own explicit Gateway
// scope item, independent of "Webhook: Payment Success".
export async function captureRazorpayPayment(tenantId: string, paymentId: string, context: BillingContext): Promise<PaymentDTO> {
  const payment = await getPayment(tenantId, paymentId);
  if (!payment.gatewayPaymentId) {
    // The gateway has not reported a payment attempt against this order yet — there is nothing
    // to capture. Not a NotFoundError (the Payment row itself exists); this is a state the
    // Payment simply isn't in yet.
    throw new InvalidPaymentTransitionError(
      "This payment has no gateway payment id yet — the gateway has not reported a payment attempt to capture."
    );
  }

  const gatewayProvider = getGatewayProvider();
  const result = await gatewayProvider.capturePayment(
    payment.gatewayPaymentId,
    Math.round(payment.amount * 100),
    payment.currency
  );

  return markPaymentCaptured(paymentId, { gatewayPaymentId: result.gatewayPaymentId }, context);
}

// Issues a refund at the gateway, then records it on our own Payment row. Gateway-first,
// database-second — mirrors captureRazorpayPayment's own ordering, so a Payment is never marked
// refunded in our system without the gateway having actually accepted the refund request.
export async function refundRazorpayPayment(
  tenantId: string,
  paymentId: string,
  refundAmount: number,
  context: BillingContext
): Promise<PaymentDTO> {
  const payment = await getPayment(tenantId, paymentId);
  if (!payment.gatewayPaymentId) {
    throw new InvalidPaymentTransitionError("This payment has no gateway payment id — there is nothing to refund at the gateway.");
  }

  const gatewayProvider = getGatewayProvider();
  await gatewayProvider.createRefund(payment.gatewayPaymentId, Math.round(refundAmount * 100));

  return refundPayment(paymentId, { refundAmount }, context);
}

// Thin passthrough to PaymentGatewayProvider.verifyCheckoutSignature — see that interface
// method's own doc comment for the full reasoning. Repeated here because this is the one place a
// future checkout-callback route handler would call it from: this is a FIRST-PASS trust signal
// ONLY (a client can lie about calling it, or the tab can close before it fires). It is never
// sufficient on its own to mark a payment captured — the webhook (webhook-processing.service.ts,
// backed by verifyWebhookSignature) remains the sole authoritative source of truth, per the
// approved Architecture Review.
export function verifyRazorpayCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const gatewayProvider = getGatewayProvider();
  return gatewayProvider.verifyCheckoutSignature(orderId, paymentId, signature);
}
