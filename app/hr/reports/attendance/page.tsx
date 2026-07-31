import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getStaffAttendanceSummaryReport } from "@/modules/hr/application/get-staff-attendance-summary-report.service";

interface AttendanceSummaryReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Staff Attendance Summary Report (Phase 13 spec §11.b). Year/month are numeric <select>s rather
// than a single type="month" input, matching the service's own (year, month) signature exactly —
// no client-side date-splitting needed.
export default async function AttendanceSummaryReportPage({ searchParams }: AttendanceSummaryReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hr.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const now = new Date();
  const year = Number(first(params.year)) || now.getFullYear();
  const month = Number(first(params.month)) || now.getMonth() + 1;

  const rows = await getStaffAttendanceSummaryReport(authContext.tenantId, authContext.schoolId, year, month);

  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - 4 + index);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/hr/reports" className="text-sm text-blue-600 hover:underline">
        ← HR & Payroll Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Staff Attendance Summary Report</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Present / absent / late / half-day / leave day counts for every active employee, for one month.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="year" className="text-xs font-medium text-zinc-500">
            Year
          </label>
          <select id="year" name="year" defaultValue={String(year)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
            {yearOptions.map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="month" className="text-xs font-medium text-zinc-500">
            Month
          </label>
          <select id="month" name="month" defaultValue={String(month)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Present</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Absent</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Late</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Half Day</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Leave</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.employeeId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.employeeCode}</td>
                <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.presentDays}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.absentDays}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.lateDays}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.halfDays}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.leaveDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No active employees found.</p>}
      </div>
    </main>
  );
}
