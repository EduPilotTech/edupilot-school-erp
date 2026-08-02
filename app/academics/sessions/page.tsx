import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { AcademicSessionManager } from "@/components/features/academics/AcademicSessionManager";
import type { AcademicSessionDTO } from "@/modules/academics/application/dto/academic-session.dto";

export default async function AcademicSessionsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("academic-session.view");
  const authorization = await getAuthorizationContext();

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });

  const items: AcademicSessionDTO[] = sessions.map((session) => ({
    id: session.id,
    sessionName: session.sessionName,
    startDate: session.startDate.toISOString(),
    endDate: session.endDate.toISOString(),
    isCurrent: session.isCurrent,
    status: session.status,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Academic Sessions</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The academic years your school runs. Create a session first, then add classes and sections under it.
      </p>

      <div className="mt-6">
        <AcademicSessionManager items={items} canManage={can(authorization, "academic-session.manage")} />
      </div>
    </main>
  );
}
