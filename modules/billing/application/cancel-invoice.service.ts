import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionInvoiceRepository } from "../infrastructure/prisma-subscription-invoice.repository";
import { InvalidInvoiceStatusTransitionError } from "../domain/errors";
import { getSubscriptionInvoice, toSubscriptionInvoiceDTO } from "./generate-subscription-invoice.service";
import { recordPlatformAudit } from "./billing-audit.helpers";
import { cancelInvoiceSchema } from "./dto/cancel-invoice.dto";
import type { SubscriptionInvoiceDTO } from "./dto/subscription-invoice.dto";
import type { BillingContext } from "./billing-context";

const invoiceRepository = new PrismaSubscriptionInvoiceRepository();

// Cancels (VOIDs) a SubscriptionInvoice that hasn't been settled yet — mirrors
// subscription.service.ts's cancelSubscription in spirit (load, guard by current status, flip,
// audit), but a SubscriptionInvoice has no dedicated `cancellationReason` column the way
// Subscription does (see SubscriptionInvoiceRepository.updateStatus's own input shape), so the
// caller-supplied reason is carried on the audit row's `afterState` instead of on the entity
// itself — the audit log is this action's permanent record of *why*.
export async function cancelInvoice(
  tenantId: string,
  invoiceId: string,
  input: unknown,
  context: BillingContext
): Promise<SubscriptionInvoiceDTO> {
  const parsed = cancelInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid cancellation request.");
  }
  const { reason } = parsed.data;
  const { actingUserId } = context;

  // Throws SubscriptionInvoiceNotFoundError if the invoice doesn't exist (or belongs to another
  // tenant) — same not-found discipline as every other mutating service in this module.
  const invoice = await getSubscriptionInvoice(tenantId, invoiceId);

  if (invoice.status === "PAID") {
    throw new InvalidInvoiceStatusTransitionError(
      "A paid invoice cannot be cancelled directly — issue a refund against its payment(s) instead."
    );
  }
  if (invoice.status === "VOID") {
    throw new InvalidInvoiceStatusTransitionError("This invoice has already been cancelled.");
  }

  const updated = await invoiceRepository.updateStatus(tenantId, invoiceId, {
    status: "VOID",
    updatedBy: actingUserId,
  });

  await recordPlatformAudit({
    tenantId,
    actorId: actingUserId,
    action: "INVOICE_CANCELLED",
    entityType: "SubscriptionInvoice",
    entityId: invoiceId,
    beforeState: invoice,
    afterState: { ...toSubscriptionInvoiceDTO(updated), cancellationReason: reason },
  });

  return toSubscriptionInvoiceDTO(updated);
}
