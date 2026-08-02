import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getSubscriptionPlanDefinition } from "@/modules/billing/application/subscription-plan-definition.service";
import { listPlanFeatureEntitlements } from "@/modules/billing/application/plan-feature-entitlement.service";
import { PlanFeatureEntitlementManager } from "@/components/features/platform/PlanFeatureEntitlementManager";

interface PlatformPlanDetailPageProps {
  params: Promise<{ planId: string }>;
}

export default async function PlatformPlanDetailPage({ params }: PlatformPlanDetailPageProps) {
  const { planId } = await params;
  await requireAuthContext();
  await requirePermission("platform.billing.manage");

  const plan = await getSubscriptionPlanDefinition(planId);
  if (!plan) notFound();

  const entitlements = await listPlanFeatureEntitlements(planId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/platform/plans" className="text-sm text-blue-600 hover:underline">
        ← Plan Catalog
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{plan.name}</h1>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            plan.isActive ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {plan.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">{plan.description ?? "No description."}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-5 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-500">Plan Code</dt>
          <dd className="text-zinc-900">{plan.planCode}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Monthly Price</dt>
          <dd className="text-zinc-900">
            {plan.currency} {plan.monthlyPrice.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Annual Price</dt>
          <dd className="text-zinc-900">
            {plan.currency} {plan.annualPrice.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Trial Days</dt>
          <dd className="text-zinc-900">{plan.trialDays}</dd>
        </div>
      </dl>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">Feature Entitlements</h2>
        <PlanFeatureEntitlementManager subscriptionPlanDefinitionId={plan.id} items={entitlements} />
      </div>
    </main>
  );
}
