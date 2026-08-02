import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionInvoiceRepository } from "../infrastructure/prisma-subscription-invoice.repository";
import { PrismaPaymentRepository } from "../infrastructure/prisma-payment.repository";
import {
  DuplicateGatewayOrderError,
  InvalidInvoiceStatusTransitionError,
  InvalidPaymentTransitionError,
  PaymentNotFoundError,
  RefundExceedsPaymentAmountError,
  SubscriptionInvoiceNotFoundError,
} from "../domain/errors";
import { isValidPaymentTransition } from "./payment-transition.helpers";
import { recordPlatformAudit } from "./billing-audit.helpers";
import {
  initiatePaymentSchema,
  markPaymentCapturedSchema,
  markPaymentFailedSchema,
  refundPaymentSchema,
  type PaymentDTO,
} from "./dto/payment.dto";
import type { PaymentEntity } from "../domain/payment.entity";
import type { BillingContext } from "./billing-context";

function toDTO(entity: PaymentEntity): PaymentDTO {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    subscriptionInvoiceId: entity.subscriptionInvoiceId,
    gatewayProvider: entity.gatewayProvider,
    gatewayOrderId: entity.gatewayOrderId,
    gatewayPaymentId: entity.gatewayPaymentId,
    amount: entity.amount,
    currency: entity.currency,
    status: entity.status,
    method: entity.method,
    failureReason: entity.failureReason,
    refundedAmount: entity.refundedAmount,
    capturedAt: entity.capturedAt ? entity.capturedAt.toISOString() : null,
    refundedAt: entity.refundedAt ? entity.refundedAt.toISOString() : null,
  };
}

const invoiceRepository = new PrismaSubscriptionInvoiceRepository();
const paymentRepository = new PrismaPaymentRepository();

// Opens a gateway transaction attempt against an invoice — mirrors modules/fees' collect-payment
// discipline in spirit (validate against the parent record, never edit an existing payment), but
// unlike a FeePayment this is CREATED, not settled, until the gateway later confirms capture via
// markPaymentCaptured. Idempotency on (gatewayProvider, gatewayOrderId) is DB-enforced (see the
// schema's own unique constraint), so the P2002 fallback here is the redelivery/double-submit
// race, not the primary check.
export async function initiatePayment(input: unknown, context: BillingContext): Promise<PaymentDTO> {
  const parsed = initiatePaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid payment data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const invoice = await invoiceRepository.findById(tenantId, data.subscriptionInvoiceId);
  if (!invoice) {
    throw new SubscriptionInvoiceNotFoundError();
  }

  const existing = await paymentRepository.findByGatewayOrderId(tenantId, data.gatewayProvider, data.gatewayOrderId);
  if (existing) {
    throw new DuplicateGatewayOrderError();
  }

  try {
    const payment = await paymentRepository.create({
      tenantId,
      subscriptionInvoiceId: data.subscriptionInvoiceId,
      gatewayProvider: data.gatewayProvider,
      gatewayOrderId: data.gatewayOrderId,
      amount: data.amount,
      currency: data.currency,
      method: data.method ?? null,
      createdBy: actingUserId,
    });

    await recordPlatformAudit({
      tenantId,
      actorId: actingUserId,
      action: "PAYMENT_INITIATED",
      entityType: "Payment",
      entityId: payment.id,
      afterState: payment,
    });

    return toDTO(payment);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DuplicateGatewayOrderError();
    }
    throw error;
  }
}

// Settles the payment on gateway confirmation and, once this payment fully covers the invoice's
// own totalAmount, settles the invoice to PAID in the same transaction — mirrors
// salary-payment.service.ts's recordSalaryPayment "settle the parent once fully covered" shape.
export async function markPaymentCaptured(paymentId: string, input: unknown, context: BillingContext): Promise<PaymentDTO> {
  const parsed = markPaymentCapturedSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid capture data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const payment = await paymentRepository.findById(tenantId, paymentId);
  if (!payment) throw new PaymentNotFoundError();
  if (!isValidPaymentTransition(payment.status, "CAPTURED")) {
    throw new InvalidPaymentTransitionError(`A payment in ${payment.status} status cannot be captured.`);
  }

  const invoice = await invoiceRepository.findById(tenantId, payment.subscriptionInvoiceId);
  if (!invoice) throw new SubscriptionInvoiceNotFoundError();
  if (invoice.status === "VOID") {
    throw new InvalidInvoiceStatusTransitionError("A VOID invoice cannot be settled by a captured payment.");
  }

  const captured = await prisma.$transaction(async (tx) => {
    const updated = await paymentRepository.updateStatus(
      tenantId,
      paymentId,
      {
        status: "CAPTURED",
        gatewayPaymentId: data.gatewayPaymentId,
        gatewayResponseSnapshot: data.gatewayResponseSnapshot,
        capturedAt: new Date(),
        updatedBy: actingUserId,
      },
      tx
    );

    if (payment.amount >= invoice.totalAmount) {
      await invoiceRepository.updateStatus(
        tenantId,
        invoice.id,
        { status: "PAID", paidAt: new Date(), updatedBy: actingUserId },
        tx
      );
    }

    await recordPlatformAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "PAYMENT_CAPTURED",
        entityType: "Payment",
        entityId: updated.id,
        beforeState: payment,
        afterState: updated,
      },
      tx
    );

    return updated;
  });

  return toDTO(captured);
}

export async function markPaymentFailed(paymentId: string, input: unknown, context: BillingContext): Promise<PaymentDTO> {
  const parsed = markPaymentFailedSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid failure data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const payment = await paymentRepository.findById(tenantId, paymentId);
  if (!payment) throw new PaymentNotFoundError();
  if (!isValidPaymentTransition(payment.status, "FAILED")) {
    throw new InvalidPaymentTransitionError(`A payment in ${payment.status} status cannot be marked as failed.`);
  }

  const updated = await paymentRepository.updateStatus(tenantId, paymentId, {
    status: "FAILED",
    failureReason: data.failureReason,
    gatewayResponseSnapshot: data.gatewayResponseSnapshot,
    updatedBy: actingUserId,
  });

  await recordPlatformAudit({
    tenantId,
    actorId: actingUserId,
    action: "PAYMENT_FAILED",
    entityType: "Payment",
    entityId: updated.id,
    beforeState: payment,
    afterState: updated,
  });

  return toDTO(updated);
}

// Multiple partial refunds are allowed to accumulate (PARTIALLY_REFUNDED -> PARTIALLY_REFUNDED is
// a legal transition — see payment-transition.helpers.ts's own comment); the running total is
// validated against the payment's own amount, never against a single refund's size in isolation.
export async function refundPayment(paymentId: string, input: unknown, context: BillingContext): Promise<PaymentDTO> {
  const parsed = refundPaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid refund request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const payment = await paymentRepository.findById(tenantId, paymentId);
  if (!payment) throw new PaymentNotFoundError();

  const newRefundedAmount = Math.round((payment.refundedAmount + data.refundAmount) * 100) / 100;
  if (newRefundedAmount > payment.amount) {
    throw new RefundExceedsPaymentAmountError();
  }

  const newStatus = newRefundedAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
  if (!isValidPaymentTransition(payment.status, newStatus)) {
    throw new InvalidPaymentTransitionError(`A payment in ${payment.status} status cannot be refunded.`);
  }

  const refunded = await paymentRepository.recordRefund(tenantId, paymentId, {
    status: newStatus,
    refundedAmount: newRefundedAmount,
    refundedAt: new Date(),
    updatedBy: actingUserId,
  });

  await recordPlatformAudit({
    tenantId,
    actorId: actingUserId,
    action: "PAYMENT_REFUNDED",
    entityType: "Payment",
    entityId: refunded.id,
    beforeState: payment,
    afterState: refunded,
  });

  return toDTO(refunded);
}

export async function listPaymentsForInvoice(tenantId: string, subscriptionInvoiceId: string): Promise<PaymentDTO[]> {
  const payments = await paymentRepository.findByInvoice(tenantId, subscriptionInvoiceId);
  return payments.map(toDTO);
}

export async function getPayment(tenantId: string, id: string): Promise<PaymentDTO> {
  const payment = await paymentRepository.findById(tenantId, id);
  if (!payment) throw new PaymentNotFoundError();
  return toDTO(payment);
}

export { toDTO as toPaymentDTO };
