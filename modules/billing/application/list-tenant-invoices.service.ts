import "server-only";
import { PrismaSubscriptionInvoiceRepository } from "../infrastructure/prisma-subscription-invoice.repository";
import { toSubscriptionInvoiceDTO } from "./generate-subscription-invoice.service";
import type { SubscriptionInvoiceEntity, SubscriptionInvoiceStatusValue } from "../domain/subscription-invoice.entity";
import type { SubscriptionInvoiceDTO } from "./dto/subscription-invoice.dto";

const invoiceRepository = new PrismaSubscriptionInvoiceRepository();

const OUTSTANDING_STATUSES: readonly SubscriptionInvoiceStatusValue[] = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"];

// The schema has no scheduled job that flips an ISSUED/PARTIALLY_PAID invoice to OVERDUE once its
// `dueDate` passes (see SubscriptionInvoiceRepository's own comment — there is no such write
// method at all), so the stored `status` alone can silently understate how many invoices are
// actually overdue. This is the single source of truth for "effectively overdue" across this
// service (`listEffectivelyOverdueInvoices` below) and billing-dashboard.service.ts's
// `overdueInvoicesCount` — both read the schema's real state through the same lens rather than
// each re-deriving it. `listOutstandingInvoices` deliberately does NOT filter through this: an
// ISSUED invoice not yet past its dueDate is still legitimately "outstanding" (money owed, not
// yet collected), just not yet overdue.
export function isEffectivelyOverdue(
  status: SubscriptionInvoiceStatusValue,
  dueDate: Date,
  referenceDate: Date = new Date()
): boolean {
  if (status === "OVERDUE") return true;
  return (status === "ISSUED" || status === "PARTIALLY_PAID") && dueDate.getTime() < referenceDate.getTime();
}

export async function getInvoiceHistory(tenantId: string): Promise<SubscriptionInvoiceDTO[]> {
  const invoices = await invoiceRepository.findByTenant(tenantId);
  return invoices.map(toSubscriptionInvoiceDTO);
}

export async function listOutstandingInvoices(tenantId: string): Promise<SubscriptionInvoiceDTO[]> {
  const invoices = await invoiceRepository.findByTenant(tenantId);
  return invoices.filter((invoice) => OUTSTANDING_STATUSES.includes(invoice.status)).map(toSubscriptionInvoiceDTO);
}

export async function listPaidInvoices(tenantId: string): Promise<SubscriptionInvoiceDTO[]> {
  const invoices = await invoiceRepository.findByTenant(tenantId);
  return invoices.filter((invoice) => invoice.status === "PAID").map(toSubscriptionInvoiceDTO);
}

// Narrower than `listOutstandingInvoices`: only the invoices that are genuinely overdue right now
// (stored OVERDUE, or ISSUED/PARTIALLY_PAID whose dueDate has already passed) — see
// `isEffectivelyOverdue`'s own comment for why this distinction exists.
export async function listEffectivelyOverdueInvoices(tenantId: string): Promise<SubscriptionInvoiceDTO[]> {
  const invoices = await invoiceRepository.findByTenant(tenantId);
  return invoices
    .filter((invoice: SubscriptionInvoiceEntity) => isEffectivelyOverdue(invoice.status, invoice.dueDate))
    .map(toSubscriptionInvoiceDTO);
}
