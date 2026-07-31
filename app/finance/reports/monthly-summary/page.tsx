import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMonthlySummaryReport } from "@/modules/finance/application/get-monthly-summary-report.service";
import { MonthlySummaryReportView } from "@/components/features/finance/MonthlySummaryReportView";

interface MonthlySummaryReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Monthly Summary Report (Phase 14 spec §6.e) — a year picker (defaulting to the current year)
// instead of the date-range/session filter every other Finance report uses, since
// getMonthlySummaryReport takes a plain `year: number`, not a filter object.
export default async function MonthlySummaryReportPage({ searchParams }: MonthlySummaryReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("finance.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const currentYear = new Date().getFullYear();
  const year = Number(first(params.year)) || currentYear;

  const report = await getMonthlySummaryReport(authContext.tenantId, authContext.schoolId, year);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/finance/reports" className="text-sm text-blue-600 hover:underline">
        ← Finance Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Monthly Summary Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Income, expense, and net totals for each of the 12 months of a chosen year.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="year" className="text-xs font-medium text-zinc-500">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            min={2000}
            max={2100}
            defaultValue={year}
            className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      <div className="mt-6">
        <MonthlySummaryReportView report={report} fileName={`monthly-summary-report-${year}`} />
      </div>
    </main>
  );
}
