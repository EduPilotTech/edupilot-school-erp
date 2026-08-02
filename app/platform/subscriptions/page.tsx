import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getBillingDashboard } from "@/modules/billing/application/billing-dashboard.service";

// Aggregate, platform-wide subscription snapshot — the per-tenant drill-down lives on School
// Management (/platform/schools), not here. Stat-tile grid layout matches app/hr/dashboard/page.tsx's
// own precedent exactly (plain numbers, no charting library).
export default async function PlatformSubscriptionsDashboardPage() {
  await requireAuthContext();
  await requirePermission("platform.billing.manage");

  const dashboard = await getBillingDashboard();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/platform" className="text-sm text-blue-600 hover:underline">
        ← Platform Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Subscription Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Platform-wide subscription counts and monthly recurring revenue, across every school.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Active Subscriptions</p>
          <p className="mt-2 text-3xl font-semibold text-green-700">{dashboard.activeSubscriptions}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Trialing</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{dashboard.trialingSubscriptions}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Past Due</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">{dashboard.pastDueSubscriptions}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Monthly Recurring Revenue</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">₹{dashboard.monthlyRecurringRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-600">
          For the per-school breakdown of subscription plan and status, see{" "}
          <Link href="/platform/schools" className="text-blue-600 hover:underline">
            School Management
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
