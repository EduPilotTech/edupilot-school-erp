import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getCurrentSubscription } from "@/modules/billing/application/subscription.service";
import { listOutstandingInvoices } from "@/modules/billing/application/list-tenant-invoices.service";
import { listSubscriptionPlanDefinitions } from "@/modules/billing/application/subscription-plan-definition.service";
import { validateLicense } from "@/modules/billing/application/license-validation.service";
import { SubscribeForm } from "./_components/subscribe-form";
import { SubscriptionActions } from "./_components/subscription-actions";

// A subscription in one of these statuses still permits self-service action (renew/upgrade/
// cancel) — CANCELED/EXPIRED are terminal, no further action makes sense from this page (a
// CANCELED tenant would need a fresh Subscribe, which the "no subscription yet" branch below
// already covers once cancellation leaves findCurrentForTenant returning null — see
// subscription.service.ts's own cancel/createSubscription comments for why a CANCELED row is
// still "current" until superseded).
const ACTIONABLE_STATUSES = new Set(["ACTIVE", "PAST_DUE", "TRIALING"]);

const STATUS_BADGE_STYLES: Record<string, string> = {
  TRIALING: "border-blue-200 bg-blue-50 text-blue-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAST_DUE: "border-amber-200 bg-amber-50 text-amber-700",
  CANCELED: "border-zinc-300 bg-zinc-100 text-zinc-600",
  EXPIRED: "border-red-200 bg-red-50 text-red-700",
};

export default async function SubscriptionPage() {
  const authContext = await requireAuthContext();
  await requirePermission("billing.subscription.manage");

  const subscription = await getCurrentSubscription(authContext.tenantId);

  if (!subscription) {
    const plans = await listSubscriptionPlanDefinitions({ isActive: true });
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/billing" className="text-sm text-blue-600 hover:underline">
          ← Billing
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Current Plan</h1>
        <p className="mt-1 text-sm text-zinc-500">Your school does not have an active subscription yet.</p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Subscribe</h2>
          <p className="mt-1 text-sm text-zinc-500">Choose a plan and billing cycle to get started.</p>
          <div className="mt-4">
            <SubscribeForm plans={plans} />
          </div>
        </div>
      </main>
    );
  }

  const [license, outstandingInvoices, plans] = await Promise.all([
    validateLicense({ tenantId: authContext.tenantId }),
    listOutstandingInvoices(authContext.tenantId),
    listSubscriptionPlanDefinitions({ isActive: true }),
  ]);

  const renewalInvoice = outstandingInvoices.find((invoice) => invoice.subscriptionId === subscription.id) ?? null;
  const otherPlans = plans.filter((plan) => plan.id !== subscription.subscriptionPlanDefinitionId);
  const isActionable = ACTIONABLE_STATUSES.has(subscription.status);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/billing" className="text-sm text-blue-600 hover:underline">
        ← Billing
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Current Plan</h1>
        <Link href="/billing/subscription/usage" className="text-sm text-blue-600 hover:underline">
          Feature Usage →
        </Link>
      </div>

      {!license.valid && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {license.reason ?? "This subscription does not currently permit full access to the application."}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{subscription.plan}</h2>
            <p className="text-sm text-zinc-500">{subscription.billingCycle}</p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[subscription.status] ?? STATUS_BADGE_STYLES.ACTIVE}`}>
            {subscription.status}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Price</dt>
            <dd className="text-zinc-900">
              {subscription.currency} {subscription.priceAtAssignment.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Current Period Ends</dt>
            <dd className="text-zinc-900">{subscription.currentPeriodEnd}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Auto-Renew</dt>
            <dd className="text-zinc-900">{subscription.autoRenew ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Trial Ends</dt>
            <dd className="text-zinc-900">{subscription.trialEndsAt ? subscription.trialEndsAt.slice(0, 10) : "—"}</dd>
          </div>
        </dl>

        {isActionable && (
          <div className="mt-6 border-t border-zinc-100 pt-4">
            <SubscriptionActions
              renewalInvoiceId={renewalInvoice?.id ?? null}
              currentPlanCode={subscription.plan}
              otherPlans={otherPlans}
            />
          </div>
        )}
      </div>
    </main>
  );
}
