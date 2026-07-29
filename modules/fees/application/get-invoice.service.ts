import "server-only";
import { PrismaFeeInvoiceRepository } from "../infrastructure/prisma-fee-invoice.repository";
import { PrismaFineRuleRepository } from "../infrastructure/prisma-fine-rule.repository";
import { FeeInvoiceNotFoundError } from "../domain/errors";
import { computeFine, resolveFineRule } from "./compute-fine.helpers";
import { computeInvoiceStatus } from "./compute-invoice-status.helpers";
import { toFeeInvoiceDTO } from "./fee-invoice.mapper";
import type { FeeInvoiceDTO } from "./dto/fee-invoice.dto";
import type { FeeInvoiceEntity } from "../domain/fee-invoice.entity";

// Applies the lazy fine computation (Phase 8 Decision 4) on top of the stored entity for any
// invoice still open — never trusts FeeInvoiceEntity.fineAmount for a PENDING/PARTIALLY_PAID/
// OVERDUE invoice, since that column stays 0 until a payment is actually collected against it.
export async function withLiveFine(tenantId: string, invoice: FeeInvoiceEntity): Promise<FeeInvoiceDTO> {
  if (invoice.status === "PAID" || invoice.status === "CANCELLED" || invoice.status === "WAIVED") {
    return toFeeInvoiceDTO(invoice);
  }

  const fineRuleRepository = new PrismaFineRuleRepository();
  const rules = await fineRuleRepository.findByAcademicSession(tenantId, invoice.academicSessionId);
  const rule = resolveFineRule(rules, invoice.feeCategoryId);
  const asOfDate = new Date();
  const liveFine = computeFine({ amount: invoice.amount, dueDate: invoice.dueDate, asOfDate }, rule);

  const liveStatus = computeInvoiceStatus({
    amount: invoice.amount,
    discountAmount: invoice.discountAmount,
    fineAmount: liveFine,
    amountPaid: invoice.amountPaid,
    dueDate: invoice.dueDate,
    asOfDate,
  });

  return toFeeInvoiceDTO({ ...invoice, fineAmount: liveFine, status: liveStatus });
}

export async function getFeeInvoice(tenantId: string, invoiceId: string): Promise<FeeInvoiceDTO> {
  const repository = new PrismaFeeInvoiceRepository();
  const invoice = await repository.findById(tenantId, invoiceId);
  if (!invoice) {
    throw new FeeInvoiceNotFoundError();
  }
  return withLiveFine(tenantId, invoice);
}
