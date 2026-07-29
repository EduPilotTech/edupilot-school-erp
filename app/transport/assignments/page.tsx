import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listRoutes } from "@/modules/transport/application/list-routes.service";
import { listRouteStops } from "@/modules/transport/application/list-route-stops.service";
import { getStudentTransportAssignment } from "@/modules/transport/application/list-student-transport-assignments.service";
import { StudentTransportAssignmentTable } from "@/components/features/transport/StudentTransportAssignmentTable";
import type { RouteStopDTO } from "@/modules/transport/application/dto/route.dto";

interface AssignmentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentTransportAssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("transport.student-assignment.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";
  const search = first(params.q) ?? "";

  const routes = await listRoutes({ tenantId: authContext.tenantId }, { isActive: true });
  const stopsByRoute: Record<string, RouteStopDTO[]> = {};
  for (const route of routes) {
    stopsByRoute[route.id] = await listRouteStops({ tenantId: authContext.tenantId }, route.id);
  }

  const studentResult = search
    ? await listStudents({ search, page: 1, pageSize: 20 }, { tenantId: authContext.tenantId })
    : { items: [], total: 0, page: 1, pageSize: 20 };

  const students = academicSessionId
    ? await Promise.all(
        studentResult.items.map(async (student) => ({
          id: student.id,
          admissionNumber: student.admissionNumber,
          fullName: `${student.firstName} ${student.lastName}`,
          currentAssignment: await getStudentTransportAssignment(
            { tenantId: authContext.tenantId },
            student.id,
            academicSessionId
          ),
        }))
      )
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Student Transport Assignment</h1>
      <p className="mt-1 text-sm text-zinc-500">Assign a route and stop to a student for this session.</p>

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
          <label htmlFor="q" className="text-xs font-medium text-zinc-500">
            Search Student
          </label>
          <input
            id="q"
            name="q"
            defaultValue={search}
            placeholder="Admission number or name"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Search
        </button>
      </form>

      <div className="mt-6">
        {routes.length === 0 ? (
          <p className="text-sm text-zinc-500">No active routes yet — create one under Routes first.</p>
        ) : (
          <StudentTransportAssignmentTable
            academicSessionId={academicSessionId}
            students={students}
            routes={routes}
            stopsByRoute={stopsByRoute}
            canManage
          />
        )}
      </div>
    </main>
  );
}
