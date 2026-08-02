import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listBillingRuns } from "@/modules/billing/application/billing-run.service";
import { BillingRunListManager } from "@/components/features/platform/BillingRunListManager";

export default async function PlatformBillingRunsPage() {
  await requireAuthContext();
  await requirePermission("platform.billing.manage");

  const runs = await listBillingRuns();
  const sortedRuns = [...runs].sort((a, b) => (a.billingPeriod < b.billingPeriod ? 1 : -1));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/platform" className="text-sm text-blue-600 hover:underline">
        ← Platform Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Billing Runs</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create a monthly billing run, then process it to generate subscription invoices for every
        school whose subscription period starts that month.
      </p>

      <div className="mt-6">
        <BillingRunListManager items={sortedRuns} />
      </div>
    </main>
  );
}
