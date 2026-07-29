import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listRoutes } from "@/modules/transport/application/list-routes.service";
import { getRouteStudentList } from "@/modules/transport/application/get-route-student-list.service";
import { getRouteTransportAttendance } from "@/modules/transport/application/get-transport-attendance.service";
import { TransportAttendanceMarker } from "@/components/features/transport/TransportAttendanceMarker";
import type { TransportTripLegValue } from "@/modules/transport/domain/transport-attendance.entity";

interface TransportAttendancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function TransportAttendancePage({ searchParams }: TransportAttendancePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("transport.attendance.mark");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || "";
  const routes = await listRoutes({ tenantId: authContext.tenantId }, { isActive: true });
  const routeId = first(params.routeId) || routes[0]?.id || "";
  const date = first(params.date) ?? todayIsoDate();
  const tripLeg = (first(params.tripLeg) ?? "PICKUP") as TransportTripLegValue;

  const canLoadRoster = Boolean(academicSessionId && routeId && date);

  const [studentList, existingAttendance] = canLoadRoster
    ? await Promise.all([
        getRouteStudentList(authContext.tenantId, routeId, academicSessionId),
        getRouteTransportAttendance({ tenantId: authContext.tenantId }, routeId, new Date(date), tripLeg),
      ])
    : [null, []];

  const statusByStudentId = new Map(existingAttendance.map((row) => [row.studentId, row.status]));
  const rows =
    studentList?.rows
      .filter((row) => row.status === "ACTIVE")
      .map((row) => ({
        studentId: row.studentId,
        admissionNumber: row.admissionNumber,
        fullName: row.fullName,
        stopName: row.stopName,
        status: statusByStudentId.get(row.studentId) ?? null,
      })) ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Daily Transport Attendance</h1>
      <p className="mt-1 text-sm text-zinc-500">Mark boarding for one route, date, and trip leg at a time.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
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
        <div className="flex flex-col gap-1">
          <label htmlFor="tripLeg" className="text-xs font-medium text-zinc-500">
            Trip
          </label>
          <select
            id="tripLeg"
            name="tripLeg"
            defaultValue={tripLeg}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="PICKUP">Pickup</option>
            <option value="DROP">Drop</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load Roster
        </button>
      </form>

      <div className="mt-6">
        {canLoadRoster ? (
          <TransportAttendanceMarker
            routeId={routeId}
            academicSessionId={academicSessionId}
            date={date}
            tripLeg={tripLeg}
            rows={rows}
          />
        ) : (
          <p className="text-sm text-zinc-500">Select a session, route, and date to load the roster.</p>
        )}
      </div>
    </main>
  );
}
