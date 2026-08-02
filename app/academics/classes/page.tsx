import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can, requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { ClassManager } from "@/components/features/academics/ClassManager";

export default async function ClassesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("class.view");
  const authorization = await getAuthorizationContext();

  const [sessions, classes] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Classes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Classes belong to an academic session (e.g. Pre Nursery, Nursery, Class I). Add sections under each class next.
      </p>

      <div className="mt-6">
        <ClassManager
          items={classes.map((c) => ({
            id: c.id,
            academicSessionId: c.academicSessionId,
            name: c.name,
            grade: c.grade,
          }))}
          sessions={sessions.map((s) => ({ id: s.id, sessionName: s.sessionName }))}
          canManage={can(authorization, "class.manage")}
        />
      </div>
    </main>
  );
}
