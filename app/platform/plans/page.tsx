import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listSubscriptionPlanDefinitions } from "@/modules/billing/application/subscription-plan-definition.service";
import { SubscriptionPlanManager } from "@/components/features/platform/SubscriptionPlanManager";

// Plan Catalog list — no `filter` is passed to listSubscriptionPlanDefinitions(), so both active
// and deactivated plans show here (isActive is rendered as a badge, mirroring how every other
// master-data manager in this codebase shows inactive rows rather than hiding them).
export default async function PlatformPlansPage() {
  await requireAuthContext();
  await requirePermission("platform.billing.manage");

  const plans = await listSubscriptionPlanDefinitions();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/platform" className="text-sm text-blue-600 hover:underline">
        ← Platform Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Plan Catalog</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Subscription plan definitions. Open a plan to manage its feature entitlements.
      </p>

      <div className="mt-6">
        <SubscriptionPlanManager items={plans} />
      </div>
    </main>
  );
}
