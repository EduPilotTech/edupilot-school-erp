export type PaymentGatewayProviderCodeValue = "RAZORPAY" | "PHONEPE";
export type PaymentStatusValue = "CREATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

// Tenant-owned — one gateway transaction attempt against a SubscriptionInvoice, mirrors
// FeePayment/SalaryPayment's "immutable once settled, corrections via refund/status-flip only"
// discipline. Never stores card/instrument data — only gateway-issued identifiers and status
// metadata.
export interface PaymentEntity {
  id: string;
  tenantId: string;
  subscriptionInvoiceId: string;
  gatewayProvider: PaymentGatewayProviderCodeValue;
  gatewayOrderId: string;
  // Null until captured.
  gatewayPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatusValue;
  // Gateway-reported (card/upi/netbanking) — free text, not an enum.
  method: string | null;
  gatewayResponseSnapshot: unknown;
  failureReason: string | null;
  refundedAmount: number;
  capturedAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
