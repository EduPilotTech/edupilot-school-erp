import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaFeePaymentRepository } from "../infrastructure/prisma-fee-payment.repository";
import { PrismaFeePaymentAllocationRepository } from "../infrastructure/prisma-fee-payment-allocation.repository";
import { PrismaFeeInvoiceRepository } from "../infrastructure/prisma-fee-invoice.repository";
import { computeInvoiceStatus } from "./compute-invoice-status.helpers";
import { appendLedgerEntry } from "./fee-ledger.helpers";
import { recordFeeAudit } from "./fee-audit.helpers";
import { toFeePaymentDTO } from "./fee-payment.mapper";
import { FeePaymentNotFoundError, PaymentAlreadyReversedError, PaymentNotReversibleError } from "../domain/errors";
import { reversePaymentSchema } from "./dto/fee-payment.dto";
import type { FeePaymentDTO } from "./dto/fee-payment.dto";

export interface ReversePaymentContext {
  tenantId: string;
  actingUserId: string;
}

// Reverses a payment (Decision 10 — never edits/deletes it): flips FeePayment.status to REVERSED
// (the one allowed mutation on an otherwise-immutable receipt), then rolls back each invoice it
// had funded (decrementing amountPaid, recomputing status). The fine snapshotted at collection
// time is deliberately left untouched on the invoice — it remains part of the historical record
// even after a reversal (Decision 4's snapshot, once taken, is permanent).
export async function reversePayment(input: unknown, context: ReversePaymentContext): Promise<FeePaymentDTO> {
  const parsed = reversePaymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid reversal request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const paymentRepository = new PrismaFeePaymentRepository();
  const payment = await paymentRepository.findById(tenantId, data.paymentId);
  if (!payment) {
    throw new FeePaymentNotFoundError();
  }
  if (payment.status === "REVERSED") {
    throw new PaymentAlreadyReversedError();
  }
  if (payment.status !== "COMPLETED") {
    throw new PaymentNotReversibleError();
  }

  const allocationRepository = new PrismaFeePaymentAllocationRepository();
  const allocations = await allocationRepository.findByPayment(tenantId, payment.id);

  const invoiceRepository = new PrismaFeeInvoiceRepository();
  const invoiceIds = allocations.map((allocation) => allocation.invoiceId);
  const invoices = await invoiceRepository.findByIds(tenantId, invoiceIds);
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const asOfDate = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const reversed = await paymentRepository.reverse(tenantId, payment.id, actingUserId, data.reason, tx);

    for (const allocation of allocations) {
      const invoice = invoiceById.get(allocation.invoiceId);
      if (!invoice) continue;

      const newAmountPaid = Math.round((invoice.amountPaid - allocation.amountAllocated) * 100) / 100;
      const newStatus = computeInvoiceStatus({
        amount: invoice.amount,
        discountAmount: invoice.discountAmount,
        fineAmount: invoice.fineAmount,
        amountPaid: newAmountPaid,
        dueDate: invoice.dueDate,
        asOfDate,
      });

      await invoiceRepository.rollbackPayment(tenantId, invoice.id, allocation.amountAllocated, newStatus, tx);

      await appendLedgerEntry(
        {
          tenantId,
          studentId: payment.studentId,
          academicSessionId: payment.academicSessionId,
          entryType: "REVERSAL",
          referenceType: "FeePayment",
          referenceId: payment.id,
          debit: allocation.amountAllocated,
          description: `Payment ${payment.receiptNumber} reversed: ${data.reason}`,
          createdBy: actingUserId,
        },
        tx
      );
    }

    await recordFeeAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "PAYMENT_REVERSED",
        entityType: "FeePayment",
        entityId: payment.id,
        beforeState: payment,
        afterState: reversed,
      },
      tx
    );

    return toFeePaymentDTO(reversed, allocations);
  });
}
