import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getSchoolCalendar } from "@/modules/communication/application/get-school-calendar.service";

// School Calendar (requirement 15) — composed from the existing Holiday model UNIONed with new
// CalendarEvent rows (Decision 7).
export default async function ParentCalendarPage() {
  const authContext = await requireAuthContext();
  await requirePermission("parent.calendar.view");

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];

  const items = currentSession ? await getSchoolCalendar(authContext.tenantId, currentSession.id) : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">School Calendar</h1>
      <p className="mt-1 text-sm text-zinc-500">{currentSession?.sessionName}</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Title</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-zinc-900">
                  {item.startDate}
                  {item.endDate ? ` – ${item.endDate}` : ""}
                </td>
                <td className="px-4 py-2 text-zinc-700">{item.title}</td>
                <td className="px-4 py-2 text-zinc-700">{item.eventType}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No calendar entries yet.</p>}
      </div>
    </main>
  );
}
