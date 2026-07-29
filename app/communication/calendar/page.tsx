import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getSchoolCalendar } from "@/modules/communication/application/get-school-calendar.service";
import { CalendarEventManager } from "@/components/features/communication/CalendarEventManager";

export default async function CommunicationCalendarPage() {
  const authContext = await requireAuthContext();
  await requirePermission("communication.calendar.view");
  const authorization = await getAuthorizationContext();

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];

  const items = currentSession ? await getSchoolCalendar(authContext.tenantId, currentSession.id) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">School Calendar</h1>
      <p className="mt-1 text-sm text-zinc-500">Composed from Holidays plus exam/PTM/event entries.</p>

      <div className="mt-6">
        {currentSession ? (
          <CalendarEventManager
            academicSessionId={currentSession.id}
            items={items}
            canManage={can(authorization, "communication.calendar.manage")}
          />
        ) : (
          <p className="text-sm text-zinc-500">No active academic session found.</p>
        )}
      </div>
    </main>
  );
}
