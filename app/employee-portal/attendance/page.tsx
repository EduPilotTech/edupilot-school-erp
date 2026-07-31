import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyAttendance } from "@/modules/hr/application/employee-portal.service";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { resolveCurrentEmployeeId } from "../_lib/resolve-current-employee";

interface EmployeePortalAttendancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
};

function currentYear(): number {
  return new Date().getFullYear();
}

function currentMonth(): number {
  return new Date().getMonth() + 1;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// My Attendance — mirrors app/hr/attendance/monthly/page.tsx's table shape, scoped to the
// caller's own employeeId only (resolved server-side, never from a query param).
export default async function EmployeePortalAttendancePage({ searchParams }: EmployeePortalAttendancePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("employee.portal.access");

  let employeeId: string;
  try {
    employeeId = await resolveCurrentEmployeeId(authContext.tenantId, authContext.userId);
  } catch (error) {
    if (error instanceof EmployeeNotFoundError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-zinc-900">My Attendance</h1>
          <p className="mt-4 text-sm text-zinc-500">No employee record is linked to your account. Contact HR.</p>
        </main>
      );
    }
    throw error;
  }

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const year = Number(first(params.year)) || currentYear();
  const month = Number(first(params.month)) || currentMonth();

  const report = await getMyAttendance(authContext.tenantId, employeeId, year, month);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/employee-portal" className="text-sm text-blue-600 hover:underline">
        ← Employee Portal
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">My Attendance</h1>
      <p className="mt-1 text-sm text-zinc-500">Day-by-day attendance and monthly summary.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="year" className="text-xs font-medium text-zinc-500">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={year}
            className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="month" className="text-xs font-medium text-zinc-500">
            Month
          </label>
          <select id="month" name="month" defaultValue={month} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(Date.UTC(2000, m - 1, 1)).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load Report
        </button>
      </form>

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-zinc-600">
          <span>Present: {report.summary.presentDays}</span>
          <span>Absent: {report.summary.absentDays}</span>
          <span>Late: {report.summary.lateDays}</span>
          <span>Half Day: {report.summary.halfDays}</span>
          <span>Leave: {report.summary.leaveDays}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Check-In</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Check-Out</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {report.entries.map((entry) => (
                <tr key={formatDate(entry.date)}>
                  <td className="px-4 py-2 text-zinc-900">{formatDate(entry.date)}</td>
                  <td className="px-4 py-2 text-zinc-700">{STATUS_LABELS[entry.status] ?? entry.status}</td>
                  <td className="px-4 py-2 text-zinc-700">{entry.checkInTime ?? "—"}</td>
                  <td className="px-4 py-2 text-zinc-700">{entry.checkOutTime ?? "—"}</td>
                  <td className="px-4 py-2 text-zinc-700">{entry.remarks ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.entries.length === 0 && <p className="p-4 text-sm text-zinc-500">No attendance recorded for this month.</p>}
        </div>
      </div>
    </main>
  );
}
