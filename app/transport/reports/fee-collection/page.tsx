import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getTransportFeeCollectionReport } from "@/modules/transport/application/get-transport-fee-collection-report.service";

interface FeeCollectionReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Transport Fee Collection Report (Phase 10 requirement 12) — a thin filter over the existing
// Fee reporting pipeline (Decision 1), not new billing-report code.
export default async function TransportFeeCollectionReportPage({ searchParams }: FeeCollectionReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("transport.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || "";

  const report = academicSessionId
    ? await getTransportFeeCollectionReport(authContext.tenantId, academicSessionId)
    : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Transport Fee Collection Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Collected vs. outstanding transport fees, grouped by route.</p>

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

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Route</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Collected</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report?.rows.map((row) => (
              <tr key={row.routeId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.routeName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.totalCollected.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{row.totalOutstanding.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!report || report.rows.length === 0) && (
          <p className="p-4 text-sm text-zinc-500">No transport invoices for this session yet.</p>
        )}
      </div>
    </main>
  );
}
