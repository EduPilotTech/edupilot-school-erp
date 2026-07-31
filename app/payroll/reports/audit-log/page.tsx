import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listPayrollAuditLog } from "@/modules/payroll/application/payroll-audit.helpers";

interface PayrollAuditLogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Payroll Audit Log (Phase 13 spec §11 supplement) — every recordPayrollAudit() write, optionally
// filtered by entity type/id. beforeState/afterState are shown as collapsed raw JSON via a plain
// <details>/<pre> — no new JSON-diff library, per the task brief.
export default async function PayrollAuditLogPage({ searchParams }: PayrollAuditLogPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("payroll.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const entityType = first(params.entityType) || undefined;
  const entityId = first(params.entityId) || undefined;

  const entries = await listPayrollAuditLog(authContext.tenantId, { entityType, entityId });
  const sortedEntries = [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/payroll/reports" className="text-sm text-blue-600 hover:underline">
        ← Payroll Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Payroll Audit Log</h1>
      <p className="mt-1 text-sm text-zinc-500">Every mutating payroll action, optionally filtered by entity type and id.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="entityType" className="text-xs font-medium text-zinc-500">
            Entity Type
          </label>
          <input
            id="entityType"
            name="entityType"
            defaultValue={entityType ?? ""}
            placeholder="e.g. PayrollRun, Payslip"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="entityId" className="text-xs font-medium text-zinc-500">
            Entity Id
          </label>
          <input
            id="entityId"
            name="entityId"
            defaultValue={entityId ?? ""}
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

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Timestamp</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Actor</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Action</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Entity Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Entity Id</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {sortedEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-2 text-zinc-700">{entry.createdAt.toLocaleString()}</td>
                <td className="px-4 py-2 text-zinc-700">{entry.actorId ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{entry.action}</td>
                <td className="px-4 py-2 text-zinc-700">{entry.entityType}</td>
                <td className="px-4 py-2 text-zinc-700">{entry.entityId}</td>
                <td className="px-4 py-2 text-zinc-700">
                  <details>
                    <summary className="cursor-pointer text-blue-600 hover:underline">View changes</summary>
                    <pre className="mt-2 max-w-md overflow-x-auto rounded-lg bg-zinc-50 p-2 text-xs text-zinc-700">
                      {JSON.stringify({ before: entry.beforeState, after: entry.afterState }, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedEntries.length === 0 && <p className="p-4 text-sm text-zinc-500">No audit log entries found.</p>}
      </div>
    </main>
  );
}
