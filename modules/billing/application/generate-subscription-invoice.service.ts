import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionRepository } from "../infrastructure/prisma-subscription.repository";
import { PrismaSubscriptionInvoiceRepository } from "../infrastructure/prisma-subscription-invoice.repository";
import { PrismaPlatformInvoiceSequenceRepository } from "../infrastructure/prisma-platform-invoice-sequence.repository";
import { SubscriptionInvoiceAlreadyExistsError, SubscriptionInvoiceNotFoundError, SubscriptionNotFoundError } from "../domain/errors";
import { resolveFinancialYear } from "./invoice-numbering.helpers";
import { recordPlatformAudit } from "./billing-audit.helpers";
import { listSubscriptionInvoicesSchema, type SubscriptionInvoiceDTO } from "./dto/subscription-invoice.dto";
import type { SubscriptionInvoiceEntity } from "../domain/subscription-invoice.entity";
import type { BillingContext } from "./billing-context";

export interface GenerateSubscriptionInvoiceInput {
  tenantId: string;
  subscriptionId: string;
  // Nullable — a manual/corrective invoice generated outside a BillingRun (see
  // SubscriptionInvoiceEntity's own comment).
  billingRunId: string | null;
  billingPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  actingUserId: string | null;
}

function toDTO(entity: SubscriptionInvoiceEntity): SubscriptionInvoiceDTO {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    subscriptionId: entity.subscriptionId,
    billingRunId: entity.billingRunId,
    invoiceNumber: entity.invoiceNumber,
    billingPeriod: entity.billingPeriod,
    periodStart: entity.periodStart.toISOString().slice(0, 10),
    periodEnd: entity.periodEnd.toISOString().slice(0, 10),
    planAtInvoice: entity.planAtInvoice,
    amount: entity.amount,
    taxAmount: entity.taxAmount,
    totalAmount: entity.totalAmount,
    currency: entity.currency,
    status: entity.status,
    issuedAt: entity.issuedAt ? entity.issuedAt.toISOString() : null,
    dueDate: entity.dueDate.toISOString().slice(0, 10),
    paidAt: entity.paidAt ? entity.paidAt.toISOString() : null,
  };
}

const subscriptionRepository = new PrismaSubscriptionRepository();
const invoiceRepository = new PrismaSubscriptionInvoiceRepository();
const sequenceRepository = new PrismaPlatformInvoiceSequenceRepository();

// The narrow, reusable invoice-creation primitive — period selection (which subscription is due,
// what its period boundaries are) is entirely the caller's concern (billing-run.service.ts for
// the batch path, a future manual-invoice Server Action for the corrective path); this function
// only turns an already-decided period into a numbered, persisted SubscriptionInvoice.
//
// Idempotent by (subscriptionId, billingPeriod): there is no DB-level unique constraint for that
// pair (only [tenantId, id] and [tenantId, invoiceNumber] are unique — see the schema's own
// comment), so the dedupe check happens here in application code before the transaction opens,
// mirroring generate-monthly-invoices.service.ts's own "check first" discipline. Runs the
// invoice-number allocation and the invoice row in one transaction — SubscriptionInvoiceRepository
// requires an already-open `tx` for exactly this reason (see its own comment).
export async function generateSubscriptionInvoice(input: GenerateSubscriptionInvoiceInput): Promise<SubscriptionInvoiceDTO> {
  const { tenantId, subscriptionId } = input;

  const subscription = await subscriptionRepository.findById(tenantId, subscriptionId);
  if (!subscription) {
    throw new SubscriptionNotFoundError();
  }

  const existingInvoices = await invoiceRepository.findBySubscription(tenantId, subscriptionId);
  const duplicate = existingInvoices.find((invoice) => invoice.billingPeriod === input.billingPeriod);
  if (duplicate) {
    throw new SubscriptionInvoiceAlreadyExistsError();
  }

  const amount = subscription.priceAtAssignment;
  const taxAmount = 0;
  const totalAmount = amount + taxAmount;

  const invoice = await prisma.$transaction(async (tx) => {
    const financialYear = resolveFinancialYear(input.periodStart);
    const invoiceNumber = await sequenceRepository.nextNumber(financialYear, tx);

    const created = await invoiceRepository.create(
      {
        tenantId,
        subscriptionId,
        billingRunId: input.billingRunId,
        invoiceNumber,
        billingPeriod: input.billingPeriod,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        planAtInvoice: subscription.plan,
        amount,
        taxAmount,
        totalAmount,
        currency: subscription.currency,
        status: "ISSUED",
        issuedAt: new Date(),
        dueDate: input.dueDate,
        createdBy: input.actingUserId,
      },
      tx
    );

    await recordPlatformAudit(
      {
        tenantId,
        actorId: input.actingUserId,
        action: "SUBSCRIPTION_INVOICE_GENERATED",
        entityType: "SubscriptionInvoice",
        entityId: created.id,
        afterState: created,
      },
      tx
    );

    return created;
  });

  return toDTO(invoice);
}

export async function listSubscriptionInvoices(input: unknown, context: BillingContext): Promise<SubscriptionInvoiceDTO[]> {
  const parsed = listSubscriptionInvoicesSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request.");
  }
  const { tenantId } = context;

  const invoices = await invoiceRepository.findBySubscription(tenantId, parsed.data.subscriptionId);
  return invoices.map(toDTO);
}

export async function getSubscriptionInvoice(tenantId: string, id: string): Promise<SubscriptionInvoiceDTO> {
  const invoice = await invoiceRepository.findById(tenantId, id);
  if (!invoice) {
    throw new SubscriptionInvoiceNotFoundError();
  }
  return toDTO(invoice);
}

export { toDTO as toSubscriptionInvoiceDTO };
