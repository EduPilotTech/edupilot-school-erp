import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getOutstandingDueReport } from "@/modules/fees/application/get-outstanding-due-report.service";

interface OutstandingDuePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OutstandingDueReportPage({ searchParams }: OutstandingDuePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.report.outstanding.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";

  const report = academicSessionId ? await getOutstandingDueReport(authContext.tenantId, academicSessionId) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Outstanding Due Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Every student with an unpaid balance, sorted highest first.</p>

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
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Switch Session
        </button>
      </form>

      {report && (
        <div className="mt-8 flex flex-col gap-4">
          <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-900">
            Total Outstanding: ₹{report.totalOutstanding.toFixed(2)}
          </p>

          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Admission #</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Student</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Class</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Outstanding</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Overdue Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {report.rows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="px-4 py-2 text-zinc-700">{row.admissionNumber}</td>
                    <td className="px-4 py-2 text-zinc-900">{row.studentName}</td>
                    <td className="px-4 py-2 text-zinc-700">{row.className}</td>
                    <td className="px-4 py-2 font-medium text-zinc-900">₹{row.totalOutstanding.toFixed(2)}</td>
                    <td className="px-4 py-2 text-zinc-700">{row.overdueInvoiceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No outstanding dues.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
