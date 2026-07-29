import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getClassCollectionReport } from "@/modules/fees/application/get-class-collection-report.service";

interface ClassCollectionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ClassCollectionReportPage({ searchParams }: ClassCollectionPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.report.classcollection.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";

  const report = academicSessionId ? await getClassCollectionReport(authContext.tenantId, academicSessionId) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Class-wise Collection Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Collected vs. outstanding, grouped by class.</p>

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
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Class</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Collected</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {report.rows.map((row) => (
                <tr key={row.classId}>
                  <td className="px-4 py-2 text-zinc-900">{row.className}</td>
                  <td className="px-4 py-2 text-zinc-700">₹{row.totalCollected.toFixed(2)}</td>
                  <td className="px-4 py-2 text-zinc-700">₹{row.totalOutstanding.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No data for this session yet.</p>}
        </div>
      )}
    </main>
  );
}
