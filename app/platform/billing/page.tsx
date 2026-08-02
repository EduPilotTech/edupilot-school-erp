import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getBillingDashboard } from "@/modules/billing/application/billing-dashboard.service";
import { getOutstandingReport } from "@/modules/billing/application/get-outstanding-report.service";
import { listSchoolsForManagement } from "@/modules/billing/application/school-management.service";

// Platform-wide billing snapshot: outstanding/overdue stat tiles plus the per-tenant outstanding
// breakdown from getOutstandingReport(). That report only carries `tenantId` per row (see
// billing-reports.dto.ts), so listSchoolsForManagement() is called alongside it purely to resolve
// tenantId -> school name for display — no billing module file is touched to do this join.
export default async function PlatformBillingDashboardPage() {
  await requireAuthContext();
  await requirePermission("platform.billing.manage");

  const [dashboard, outstandingReport, schools] = await Promise.all([
    getBillingDashboard(),
    getOutstandingReport(),
    listSchoolsForManagement(),
  ]);

  const schoolNameByTenantId = new Map(schools.map((school) => [school.tenantId, school.name]));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/platform" className="text-sm text-blue-600 hover:underline">
        ← Platform Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Billing Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Outstanding invoices and collections, platform-wide.</p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/platform/billing-runs" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:border-zinc-400">
          Billing Runs
        </Link>
        <Link href="/platform/payments" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:border-zinc-400">
          Payment Dashboard
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Outstanding Invoices</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{dashboard.outstandingInvoicesCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Outstanding Amount</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">₹{dashboard.outstandingAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Collected This Month</p>
          <p className="mt-2 text-3xl font-semibold text-green-700">₹{dashboard.collectedThisMonth.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Overdue Invoices</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">{dashboard.overdueInvoicesCount}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">Outstanding by School</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">School</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Outstanding Amount</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Invoice Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {outstandingReport.byTenant.map((row) => (
                <tr key={row.tenantId}>
                  <td className="px-4 py-2 font-medium text-zinc-900">
                    {schoolNameByTenantId.get(row.tenantId) ?? row.tenantId}
                  </td>
                  <td className="px-4 py-2 text-red-700">₹{row.outstandingAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-zinc-700">{row.invoiceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {outstandingReport.byTenant.length === 0 && (
            <p className="p-4 text-sm text-zinc-500">No outstanding invoices.</p>
          )}
        </div>
      </div>
    </main>
  );
}
