import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getCurrentSubscription } from "@/modules/billing/application/subscription.service";
import { listPlanFeatureEntitlements } from "@/modules/billing/application/plan-feature-entitlement.service";
import { resolveFeatureLock } from "@/modules/billing/application/feature-lock.service";

// Feature Usage: the full set of entitlements the current plan defines (listPlanFeatureEntitlements)
// cross-referenced against resolveFeatureLock's own live per-feature evaluation (which additionally
// accounts for license validity/school suspension, not just the raw entitlement row) — same "walk
// the plan's defined keys, resolve each live" shape for every featureKey.
export default async function FeatureUsagePage() {
  const authContext = await requireAuthContext();
  await requirePermission("billing.subscription.manage");

  const subscription = await getCurrentSubscription(authContext.tenantId);

  if (!subscription) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/billing/subscription" className="text-sm text-blue-600 hover:underline">
          ← Current Plan
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Feature Usage</h1>
        <p className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          Your school does not have an active subscription yet, so there are no plan features to show.
        </p>
      </main>
    );
  }

  const entitlements = await listPlanFeatureEntitlements(subscription.subscriptionPlanDefinitionId);
  const locks = await Promise.all(
    entitlements.map(async (entitlement) => ({
      entitlement,
      lock: await resolveFeatureLock(authContext.tenantId, entitlement.featureKey),
    }))
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/billing/subscription" className="text-sm text-blue-600 hover:underline">
        ← Current Plan
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Feature Usage</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every feature defined on your current plan ({subscription.plan}) and whether it is currently entitled.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Feature</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Entitled</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {locks.map(({ entitlement, lock }) => (
              <tr key={entitlement.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{entitlement.featureKey}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      lock.allowed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {lock.allowed ? "Yes" : "No"}
                  </span>
                  {lock.locked && lock.reason && <span className="ml-2 text-xs text-zinc-400">{lock.reason}</span>}
                </td>
                <td className="px-4 py-2 text-zinc-700">
                  {entitlement.valueType === "LIMIT" ? (lock.limit ?? entitlement.limitValue ?? "—") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entitlements.length === 0 && <p className="p-4 text-sm text-zinc-500">This plan defines no feature entitlements.</p>}
      </div>
    </main>
  );
}
