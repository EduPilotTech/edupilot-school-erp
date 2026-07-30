import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getLibraryFineReport } from "@/modules/library/application/get-fine-and-activity-reports.service";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LibraryFineReportPage({ searchParams }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("library.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || "";

  const rows = await getLibraryFineReport(authContext.tenantId, academicSessionId || undefined);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Fine Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Every library fine invoice, drawn directly from the Fee module.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId}
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400">
          Load
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Student</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Invoice #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Paid</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Balance</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => (
              <tr key={row.invoiceId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.studentName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.invoiceNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{row.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-emerald-700">{row.amountPaid.toFixed(2)}</td>
                <td className="px-4 py-2 text-red-700">{row.balance.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No library fine invoices for this session.</p>}
      </div>
    </main>
  );
}
