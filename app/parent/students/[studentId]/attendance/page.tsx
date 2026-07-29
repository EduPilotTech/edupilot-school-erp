import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getMyAttendance } from "@/modules/parents/application/get-my-attendance.service";

interface PageProps {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Attendance View (requirement 6) — reuses get-student-attendance-report.service.ts (Phase 5).
export default async function ParentStudentAttendancePage({ params, searchParams }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.attendance.view");
  const { studentId } = await params;
  const sp = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const startDate = first(sp.startDate) ?? toDateInputValue(defaultStart);
  const endDate = first(sp.endDate) ?? toDateInputValue(now);

  const report = await getMyAttendance(
    { studentId, startDate, endDate },
    { tenantId: authContext.tenantId, userProfileId: authContext.userId }
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Attendance</h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="startDate" className="text-xs font-medium text-zinc-500">
            From
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            defaultValue={startDate}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="endDate" className="text-xs font-medium text-zinc-500">
            To
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            defaultValue={endDate}
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

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        Present {report.counts.PRESENT} · Absent {report.counts.ABSENT} · Late {report.counts.LATE} · Half Day{" "}
        {report.counts.HALF_DAY} · Leave {report.counts.LEAVE}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report.entries.map((entry, index) => (
              <tr key={index}>
                <td className="px-4 py-2 text-zinc-900">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-zinc-700">{entry.status}</td>
                <td className="px-4 py-2 text-zinc-500">{entry.remarks ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {report.entries.length === 0 && <p className="p-4 text-sm text-zinc-500">No attendance records in this range.</p>}
      </div>
    </main>
  );
}
