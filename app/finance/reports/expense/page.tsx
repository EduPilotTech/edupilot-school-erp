import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getExpenseReport } from "@/modules/finance/application/get-expense-report.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { ExpenseReportView } from "@/components/features/finance/ExpenseReportView";

interface ExpenseReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// The symmetric counterpart of app/finance/reports/income/page.tsx.
export default async function ExpenseReportPage({ searchParams }: ExpenseReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("finance.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const academicSessionId = first(params.academicSessionId) || undefined;
  const fromDateRaw = first(params.fromDate) || undefined;
  const toDateRaw = first(params.toDate) || undefined;

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });

  const report = await getExpenseReport(authContext.tenantId, authContext.schoolId, {
    academicSessionId,
    fromDate: fromDateRaw ? new Date(fromDateRaw) : undefined,
    toDate: toDateRaw ? new Date(toDateRaw) : undefined,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/finance/reports" className="text-sm text-blue-600 hover:underline">
        ← Finance Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Expense Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Every expense entry, filterable by academic session and date range.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fromDate" className="text-xs font-medium text-zinc-500">
            From Date
          </label>
          <input
            id="fromDate"
            name="fromDate"
            type="date"
            defaultValue={fromDateRaw ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="toDate" className="text-xs font-medium text-zinc-500">
            To Date
          </label>
          <input
            id="toDate"
            name="toDate"
            type="date"
            defaultValue={toDateRaw ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Filter
        </button>
      </form>

      <div className="mt-6">
        <ExpenseReportView report={report} fileName="expense-report" />
      </div>
    </main>
  );
}
