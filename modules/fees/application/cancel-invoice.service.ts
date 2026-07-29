import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaFeeInvoiceRepository } from "../infrastructure/prisma-fee-invoice.repository";
import { recordFeeAudit } from "./fee-audit.helpers";
import { appendLedgerEntry } from "./fee-ledger.helpers";
import { FeeInvoiceNotFoundError, InvoiceHasPaymentsError, InvoiceNotCancellableError } from "../domain/errors";
import { toFeeInvoiceDTO } from "./fee-invoice.mapper";
import { cancelInvoiceSchema } from "./dto/fee-invoice.dto";
import type { FeeInvoiceDTO } from "./dto/fee-invoice.dto";

export interface CancelInvoiceContext {
  tenantId: string;
  actingUserId: string;
}

// Cancellation is the invoice-side half of Decision 10 (never hard-delete financial records) —
// only allowed while `amountPaid = 0`; once any payment has been collected against an invoice, it
// must be settled via reverse-payment.service.ts first (reverse the payment, then cancel).
export async function cancelInvoice(input: unknown, context: CancelInvoiceContext): Promise<FeeInvoiceDTO> {
  const parsed = cancelInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid cancellation request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaFeeInvoiceRepository();
  const invoice = await repository.findById(tenantId, data.invoiceId);
  if (!invoice) {
    throw new FeeInvoiceNotFoundError();
  }
  if (invoice.status === "CANCELLED") {
    throw new InvoiceNotCancellableError("This invoice has already been cancelled.");
  }
  if (invoice.amountPaid > 0) {
    throw new InvoiceHasPaymentsError();
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const cancelled = await repository.cancel(tenantId, data.invoiceId, actingUserId, data.reason, tx);

    await appendLedgerEntry(
      {
        tenantId,
        studentId: invoice.studentId,
        academicSessionId: invoice.academicSessionId,
        entryType: "CANCELLATION",
        referenceType: "FeeInvoice",
        referenceId: invoice.id,
        credit: invoice.amount - invoice.discountAmount,
        description: `Invoice ${invoice.invoiceNumber} cancelled: ${data.reason}`,
        createdBy: actingUserId,
      },
      tx
    );

    await recordFeeAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "INVOICE_CANCELLED",
        entityType: "FeeInvoice",
        entityId: invoice.id,
        beforeState: invoice,
        afterState: cancelled,
      },
      tx
    );

    return toFeeInvoiceDTO(cancelled);
  });
}
