import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getDailyCollectionReport } from "@/modules/fees/application/get-daily-collection-report.service";

interface DailyCollectionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DailyCollectionReportPage({ searchParams }: DailyCollectionPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.report.daily.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";
  const date = first(params.date) || today();

  const report = academicSessionId
    ? await getDailyCollectionReport(authContext.tenantId, academicSessionId, date)
    : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Daily Collection Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Every completed receipt for the selected day, grouped by payment mode.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-xs font-medium text-zinc-500">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          View
        </button>
      </form>

      {report && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="font-semibold text-zinc-900">Total Collected: ₹{report.totalCollected.toFixed(2)}</p>
            {Object.entries(report.totalsByMode)
              .filter(([, amount]) => amount > 0)
              .map(([mode, amount]) => (
                <p key={mode} className="text-zinc-700">
                  {mode}: ₹{amount.toFixed(2)}
                </p>
              ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Receipt #</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Student</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Mode</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {report.rows.map((row) => (
                  <tr key={row.paymentId}>
                    <td className="px-4 py-2 text-zinc-700">{row.receiptNumber}</td>
                    <td className="px-4 py-2 text-zinc-900">{row.studentName}</td>
                    <td className="px-4 py-2 text-zinc-700">₹{row.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-zinc-700">{row.paymentMode}</td>
                    <td className="px-4 py-2 text-zinc-700">{new Date(row.paidAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No collections on this date.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
