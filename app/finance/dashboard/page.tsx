import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getFinanceDashboard } from "@/modules/finance/application/get-finance-dashboard.service";

// Finance Dashboard (Phase 14 spec §5) — a grid of stat cards, mirroring app/hr/dashboard/page.tsx's
// exact "several KPI numbers composed into one DTO" shape. No charting library in this codebase —
// plain numbers only.
export default async function FinanceDashboardPage() {
  const authContext = await requireAuthContext();
  await requirePermission("finance.report.view");

  const dashboard = await getFinanceDashboard(authContext.tenantId, authContext.schoolId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/finance" className="text-sm text-blue-600 hover:underline">
        ← Finance & Accounts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Finance Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Today&apos;s and this month&apos;s income/expense, and current cash/bank balances.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Today&apos;s Income</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">₹{dashboard.todaysIncome.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Today&apos;s Expense</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">₹{dashboard.todaysExpense.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Monthly Income</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">₹{dashboard.monthlyIncome.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Monthly Expense</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">₹{dashboard.monthlyExpense.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Current Cash Balance</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">₹{dashboard.currentCashBalance.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Current Bank Balance</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">₹{dashboard.currentBankBalance.toFixed(2)}</p>
        </div>
      </div>
    </main>
  );
}
