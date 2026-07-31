import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listEmployees } from "@/modules/hr/application/employee.service";
import { getStaffMonthlyAttendanceReport } from "@/modules/attendance/application/get-staff-monthly-attendance-report.service";

interface StaffMonthlyAttendancePageProps {
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

// One staff member's day-by-day attendance for a calendar month, backed by the existing
// getStaffMonthlyAttendanceReport service (Phase 13's HR-side extension of staff attendance).
// View-only — gated by attendance.teacher.view, distinct from the mark permission on the parent
// Staff Attendance page.
export default async function StaffMonthlyAttendancePage({ searchParams }: StaffMonthlyAttendancePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("attendance.teacher.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const employeeResult = await listEmployees({ page: 1, pageSize: 100 }, { tenantId: authContext.tenantId });
  const activeEmployees = employeeResult.items.filter((employee) => employee.isActive);

  const userProfileId = first(params.userProfileId) || activeEmployees[0]?.userProfileId || "";
  const year = Number(first(params.year)) || currentYear();
  const month = Number(first(params.month)) || currentMonth();

  const report =
    userProfileId
      ? await getStaffMonthlyAttendanceReport({ userProfileId, year, month }, { tenantId: authContext.tenantId }).catch(
          () => null
        )
      : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/hr/attendance" className="text-sm text-blue-600 hover:underline">
        ← Staff Attendance
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Monthly Attendance Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Day-by-day attendance, check-in/out times, and monthly summary for one staff member.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="userProfileId" className="text-xs font-medium text-zinc-500">
            Employee
          </label>
          <select
            id="userProfileId"
            name="userProfileId"
            defaultValue={userProfileId}
            className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {activeEmployees.map((employee) => (
              <option key={employee.id} value={employee.userProfileId}>
                {employee.fullName} ({employee.employeeCode})
              </option>
            ))}
          </select>
        </div>
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
        {!report && <p className="text-sm text-zinc-500">Select an employee, year, and month, then click Load Report.</p>}

        {report && (
          <>
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
          </>
        )}
      </div>
    </main>
  );
}
