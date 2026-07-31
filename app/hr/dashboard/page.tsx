import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getHrDashboard } from "@/modules/hr/application/get-hr-dashboard.service";

// HR Dashboard (Phase 13 spec §12) — a grid of stat cards, matching app/parent/page.tsx's own
// "several numeric KPIs" precedent. This codebase has no charting library — plain numbers only.
export default async function HrDashboardPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hr.report.view");

  const dashboard = await getHrDashboard(authContext.tenantId, authContext.schoolId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">HR Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Headcount, attendance, leave, and payroll status at a glance.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Total Employees</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{dashboard.totalEmployees}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Present Today</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{dashboard.presentToday}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">On Leave</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{dashboard.onLeave}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Payroll Pending</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{dashboard.payrollPending}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Salary Paid</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">₹{dashboard.salaryPaid.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Salary Due</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">₹{dashboard.salaryDue.toFixed(2)}</p>
        </div>
      </div>
    </main>
  );
}
