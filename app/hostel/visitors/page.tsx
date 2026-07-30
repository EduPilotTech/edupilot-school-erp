import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listHostelResidentStudents } from "@/modules/hostel/application/list-hostel-resident-students.service";
import { getHostelVisitorReport } from "@/modules/hostel/application/get-hostel-visitor-report.service";
import { HostelVisitorManager } from "@/components/features/hostel/HostelVisitorManager";

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function endOfToday(): Date {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export default async function HostelVisitorsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.visitor.manage");

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const currentSession = sessions.find((s) => s.isCurrent) ?? sessions[0];

  const [studentOptions, visitors] = await Promise.all([
    currentSession ? listHostelResidentStudents(authContext.tenantId, currentSession.id) : Promise.resolve([]),
    getHostelVisitorReport(authContext.tenantId, startOfToday(), endOfToday()),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Visitor Register</h1>
      <p className="mt-1 text-sm text-zinc-500">Today&apos;s visitor entries — log a new entry or record an exit.</p>

      <div className="mt-6">
        <HostelVisitorManager items={visitors} studentOptions={studentOptions} canManage />
      </div>
    </main>
  );
}
