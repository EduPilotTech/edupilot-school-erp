import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listRoutes } from "@/modules/transport/application/list-routes.service";
import { getRouteStudentList } from "@/modules/transport/application/get-route-student-list.service";

interface RouteStudentListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Route-wise Student List (Phase 10 requirement 12).
export default async function RouteStudentListPage({ searchParams }: RouteStudentListPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("transport.report.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || "";
  const routes = await listRoutes({ tenantId: authContext.tenantId }, { isActive: true });
  const routeId = first(params.routeId) || routes[0]?.id || "";

  const report =
    academicSessionId && routeId ? await getRouteStudentList(authContext.tenantId, routeId, academicSessionId) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Route-wise Student List</h1>
      <p className="mt-1 text-sm text-zinc-500">Who rides which route and stop, for the selected session.</p>

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
          <label htmlFor="routeId" className="text-xs font-medium text-zinc-500">
            Route
          </label>
          <select
            id="routeId"
            name="routeId"
            defaultValue={routeId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Admission #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Stop</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Trip Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report?.rows.map((row) => (
              <tr key={row.studentId}>
                <td className="px-4 py-2 text-zinc-700">{row.admissionNumber}</td>
                <td className="px-4 py-2 text-zinc-900">{row.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.stopName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.tripType.replaceAll("_", " ")}</td>
                <td className="px-4 py-2 text-zinc-700">{row.status.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!report || report.rows.length === 0) && <p className="p-4 text-sm text-zinc-500">No students on this route.</p>}
      </div>
    </main>
  );
}
