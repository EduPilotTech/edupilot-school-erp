"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase. Covers the tenant-scoped, school-self-service side of Phase 16, Bundle E: a school's
// own subscription (subscribe/renew/upgrade, cancel), invoice/payment checkout, and refund
// initiation. `tenantId` is always read from requireAuthContext()'s own session — never from a
// client-supplied argument — for every action below, per docs/SECURITY_GUIDELINES.md §1.
//
// Gating is split by how "self-service" each action actually is:
//  - createSubscriptionAction / cancelSubscriptionAction / createRazorpayOrderAction are gated
//    `billing.subscription.manage` — ordinary tenant self-service (subscribe, change plan,
//    cancel, start a checkout), granted to SUPER_ADMIN + SCHOOL_ADMIN (see prisma/seed.ts).
//    createSubscriptionAction doubles as the "upgrade" action too: a plan change is just another
//    call to the same close-then-create createSubscription with a different
//    subscriptionPlanDefinitionId, per subscription.service.ts's own "APPEND-ONLY revision"
//    design — no separate upgrade function exists in the application layer.
//  - cancelInvoiceAction and refundRazorpayPaymentAction are deliberately gated
//    `platform.billing.manage` instead, NOT `billing.subscription.manage`: voiding an invoice or
//    reversing money already collected is a platform/finance-approved action in this system, not
//    something a school admin should be able to trigger unilaterally against its own billing
//    history — mirrors how `fee.payment.reverse` is already split from `fee.payment.collect` in
//    this same file's Phase 8 precedent (collecting money is broader-access than reversing it).
//    Both still resolve tenantId from the caller's own session (never a client-supplied
//    argument), consistent with every other action in this file — a platform-staff account
//    invoking these acts within its own session's tenant scope.

import { requireAuthContext, getCurrentSchool } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { createSubscription, cancelSubscription } from "@/modules/billing/application/subscription.service";
import { cancelInvoice } from "@/modules/billing/application/cancel-invoice.service";
import { createRazorpayOrder, refundRazorpayPayment, type CreateRazorpayOrderResult } from "@/modules/billing/application/razorpay.service";
import { generateInvoicePdf, type GenerateInvoicePdfOptions } from "@/modules/billing/application/invoice-pdf.service";
import { translateBillingError, type ActionResult } from "./_lib/translate-billing-error";
import type { SubscriptionDTO } from "@/modules/billing/application/dto/subscription.dto";
import type { SubscriptionInvoiceDTO } from "@/modules/billing/application/dto/subscription-invoice.dto";
import type { PaymentDTO } from "@/modules/billing/application/dto/payment.dto";

// --- Subscription (subscribe / upgrade / cancel) -----------------------------------------------

export async function createSubscriptionAction(input: unknown): Promise<ActionResult<SubscriptionDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("billing.subscription.manage");
  try {
    const subscription = await createSubscription(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: subscription };
  } catch (error) {
    return translateBillingError(error);
  }
}

export async function cancelSubscriptionAction(input: unknown): Promise<ActionResult<SubscriptionDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("billing.subscription.manage");
  try {
    const subscription = await cancelSubscription(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: subscription };
  } catch (error) {
    return translateBillingError(error);
  }
}

// --- Invoice ------------------------------------------------------------------------------------

// Gated `platform.billing.manage`, not `billing.subscription.manage` — see file header.
export async function cancelInvoiceAction(invoiceId: string, input: unknown): Promise<ActionResult<SubscriptionInvoiceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const invoice = await cancelInvoice(authContext.tenantId, invoiceId, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: invoice };
  } catch (error) {
    return translateBillingError(error);
  }
}

// --- Razorpay checkout / refund ------------------------------------------------------------------

// The action a "Renew"/"Pay Now" button calls to start checkout for an unpaid invoice.
export async function createRazorpayOrderAction(
  subscriptionInvoiceId: string
): Promise<ActionResult<CreateRazorpayOrderResult>> {
  const authContext = await requireAuthContext();
  await requirePermission("billing.subscription.manage");
  try {
    const result = await createRazorpayOrder(authContext.tenantId, subscriptionInvoiceId, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: result };
  } catch (error) {
    return translateBillingError(error);
  }
}

// Gated `platform.billing.manage`, not `billing.subscription.manage` — see file header. A school
// admin must never be able to refund its own payment unilaterally.
export async function refundRazorpayPaymentAction(paymentId: string, refundAmount: number): Promise<ActionResult<PaymentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("platform.billing.manage");
  try {
    const payment = await refundRazorpayPayment(authContext.tenantId, paymentId, refundAmount, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: payment };
  } catch (error) {
    return translateBillingError(error);
  }
}

// --- Invoice PDF Generation (Bundle E, Part Three's one authorized addition) --------------------

// Renders (or re-renders) a SubscriptionInvoice as a PDF and persists its storage key —
// `generateInvoicePdf` has no "already generated" guard of its own, so this is also how a school
// regenerates its invoice PDF under a different GST rate/inter-state setting. Gated
// `billing.invoice.view`, not a `.manage` permission: producing a PDF of an invoice a school can
// already see does not alter the invoice's own amounts or status, matching how `billing.invoice.
// view` is this file's only invoice-scoped self-service permission (see cancelInvoiceAction's own
// header comment for why voiding, unlike this, is gated `platform.billing.manage` instead). The
// "bill to" school info is resolved server-side via getCurrentSchool() — never accepted from the
// client — mirroring every other action in this file resolving tenantId from the session, not the
// caller's payload.
export async function generateInvoicePdfAction(
  invoiceId: string,
  options: GenerateInvoicePdfOptions
): Promise<ActionResult<SubscriptionInvoiceDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("billing.invoice.view");
  try {
    const school = await getCurrentSchool();
    const invoice = await generateInvoicePdf(authContext.tenantId, invoiceId, options, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
      billTo: {
        schoolName: school.schoolName,
        address: `${school.address}, ${school.city}, ${school.state} ${school.postalCode}`,
      },
    });
    return { success: true, data: invoice };
  } catch (error) {
    return translateBillingError(error);
  }
}
