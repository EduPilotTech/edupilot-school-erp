import type { Prisma } from "@/lib/generated/prisma/client";
import type { PaymentEntity, PaymentGatewayProviderCodeValue, PaymentStatusValue } from "./payment.entity";

export interface CreatePaymentInput {
  tenantId: string;
  subscriptionInvoiceId: string;
  gatewayProvider: PaymentGatewayProviderCodeValue;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  method?: string | null;
  createdBy?: string | null;
}

export interface UpdatePaymentStatusInput {
  status: PaymentStatusValue;
  gatewayPaymentId?: string | null;
  gatewayResponseSnapshot?: unknown;
  failureReason?: string | null;
  capturedAt?: Date | null;
  updatedBy: string | null;
}

export interface RecordPaymentRefundInput {
  status: PaymentStatusValue;
  refundedAmount: number;
  refundedAt: Date;
  updatedBy: string | null;
}

// `create`/`updateStatus`/`recordRefund` all take an optional trailing `tx` — every mutating
// caller in payment.service.ts wraps its write + audit log in one transaction, mirroring
// SalaryPaymentRepository's own "join the caller's transaction" discipline (here `tx` is optional
// rather than mandatory, since a pure status-flip with no sibling write is still safe standalone).
export interface PaymentRepository {
  findById(tenantId: string, id: string): Promise<PaymentEntity | null>;
  findByInvoice(tenantId: string, subscriptionInvoiceId: string): Promise<PaymentEntity[]>;
  findByGatewayOrderId(tenantId: string, gatewayProvider: PaymentGatewayProviderCodeValue, gatewayOrderId: string): Promise<PaymentEntity | null>;

  // Bundle C, Step 0 — additive. `findByInvoice` only scopes to one invoice; Payment/Refund
  // History reads need the tenant-wide view across every invoice the tenant has ever had. Same
  // "newest first" ordering convention as `findByInvoice` (createdAt desc).
  findByTenant(tenantId: string): Promise<PaymentEntity[]>;

  // Bundle B, Steps 3/4 — additive. A webhook arrives with no tenant context at all: it only
  // carries the gateway's own order/payment id, and resolving which tenant it belongs to IS the
  // whole point of these two lookups (see webhook-processing.service.ts's own reasoning). Backed
  // by the schema's own global-unique constraints on (gatewayProvider, gatewayOrderId) and
  // (gatewayProvider, gatewayPaymentId) — genuinely tenant-agnostic by construction, not a
  // loophole around tenant scoping.
  findByGatewayOrderIdAnyTenant(gatewayProvider: PaymentGatewayProviderCodeValue, gatewayOrderId: string): Promise<PaymentEntity | null>;
  findByGatewayPaymentIdAnyTenant(gatewayProvider: PaymentGatewayProviderCodeValue, gatewayPaymentId: string): Promise<PaymentEntity | null>;

  create(input: CreatePaymentInput, tx?: Prisma.TransactionClient): Promise<PaymentEntity>;

  updateStatus(tenantId: string, id: string, input: UpdatePaymentStatusInput, tx?: Prisma.TransactionClient): Promise<PaymentEntity>;

  recordRefund(tenantId: string, id: string, input: RecordPaymentRefundInput, tx?: Prisma.TransactionClient): Promise<PaymentEntity>;
}
