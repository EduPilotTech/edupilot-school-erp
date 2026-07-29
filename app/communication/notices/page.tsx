import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { listNotices } from "@/modules/communication/application/list-notices.service";
import { NoticeManager } from "@/components/features/communication/NoticeManager";

export default async function CommunicationNoticesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("communication.notice.view");
  const authorization = await getAuthorizationContext();

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];

  const [classes, sections, notices] = await Promise.all([
    listClasses({ tenantId: authContext.tenantId }, currentSession?.id),
    listSections({ tenantId: authContext.tenantId }),
    currentSession ? listNotices(authContext.tenantId, currentSession.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Notice Board</h1>
      <p className="mt-1 text-sm text-zinc-500">Compose and publish notices. A broadcast is a published Notice.</p>

      <div className="mt-6">
        {currentSession ? (
          <NoticeManager
            academicSessionId={currentSession.id}
            items={notices}
            classes={classes.map((c) => ({ id: c.id, name: c.name }))}
            sections={sections.map((s) => ({ id: s.id, name: s.name }))}
            canManage={can(authorization, "communication.notice.manage")}
          />
        ) : (
          <p className="text-sm text-zinc-500">No active academic session found.</p>
        )}
      </div>
    </main>
  );
}
