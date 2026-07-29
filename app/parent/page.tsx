import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getParentDashboard } from "@/modules/parents/application/get-parent-dashboard.service";

interface ParentDashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Decision 9 — student switcher, attendance, fees, results, homework, notices, upcoming events,
// all from one getParentDashboard() read.
export default async function ParentDashboardPage({ searchParams }: ParentDashboardPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.dashboard.view");

  const params = await searchParams;
  const requestedStudentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;

  const dashboard = await getParentDashboard(requestedStudentId, {
    tenantId: authContext.tenantId,
    userProfileId: authContext.userId,
  });

  if (dashboard.children.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Parent Dashboard</h1>
        <p className="mt-4 text-sm text-zinc-500">
          No students are linked to your account yet. Please contact the school office.
        </p>
      </main>
    );
  }

  const studentId = dashboard.selectedStudentId;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Parent Dashboard</h1>
        <Link href="/parent/notifications" className="text-sm text-blue-600 hover:underline">
          Notifications
          {dashboard.unreadNotificationCount > 0 && (
            <span className="ml-1.5 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              {dashboard.unreadNotificationCount}
            </span>
          )}
        </Link>
      </div>

      {dashboard.children.length > 1 && (
        <form method="get" className="mt-6 flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="studentId" className="text-xs font-medium text-zinc-500">
              Child
            </label>
            <select
              id="studentId"
              name="studentId"
              defaultValue={studentId}
              className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {dashboard.children.map((child) => (
                <option key={child.studentId} value={child.studentId}>
                  {child.fullName} ({child.admissionNumber})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Switch Child
          </button>
        </form>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={`/parent/students/${studentId}/attendance`} className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">Attendance (last 30 days)</h2>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {dashboard.attendanceSummary ? `${dashboard.attendanceSummary.percentage}%` : "—"}
          </p>
          {dashboard.attendanceSummary && (
            <p className="mt-1 text-sm text-zinc-500">
              {dashboard.attendanceSummary.presentCount} / {dashboard.attendanceSummary.totalDays} days present
            </p>
          )}
        </Link>

        <Link href={`/parent/students/${studentId}/fees`} className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">Fee Due</h2>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">₹{dashboard.feeSummary.totalOutstanding.toFixed(2)}</p>
          {dashboard.feeSummary.overdueCount > 0 && (
            <p className="mt-1 text-sm text-red-600">{dashboard.feeSummary.overdueCount} overdue invoice(s)</p>
          )}
        </Link>

        <Link href={`/parent/students/${studentId}/results`} className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400">
          <h2 className="text-sm font-medium text-zinc-500">Latest Result</h2>
          {dashboard.latestResult ? (
            <>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{dashboard.latestResult.percentage}%</p>
              <p className="mt-1 text-sm text-zinc-500">
                {dashboard.latestResult.examName}
                {dashboard.latestResult.overallGrade ? ` · Grade ${dashboard.latestResult.overallGrade}` : ""}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No published results yet.</p>
          )}
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Upcoming Homework</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {dashboard.upcomingHomework.map((item) => (
              <li key={item.id} className="text-sm text-zinc-700">
                <span className="font-medium text-zinc-900">{item.title}</span> — due {item.dueDate}
              </li>
            ))}
            {dashboard.upcomingHomework.length === 0 && <li className="text-sm text-zinc-500">No upcoming homework.</li>}
          </ul>
          <Link href="/parent/homework" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Recent Notices</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {dashboard.recentNotices.map((notice) => (
              <li key={notice.id} className="text-sm text-zinc-700">
                {notice.title}
              </li>
            ))}
            {dashboard.recentNotices.length === 0 && <li className="text-sm text-zinc-500">No recent notices.</li>}
          </ul>
          <Link href="/parent/notices" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">Upcoming Events</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {dashboard.upcomingEvents.map((event) => (
              <li key={event.id} className="text-sm text-zinc-700">
                <span className="font-medium text-zinc-900">{event.title}</span> — {event.startDate}
              </li>
            ))}
            {dashboard.upcomingEvents.length === 0 && <li className="text-sm text-zinc-500">No upcoming events.</li>}
          </ul>
          <Link href="/parent/calendar" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            View calendar
          </Link>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href={`/parent/students/${studentId}/profile`} className="text-blue-600 hover:underline">
          Student Profile
        </Link>
        <Link href={`/parent/students/${studentId}/payments`} className="text-blue-600 hover:underline">
          Payment History
        </Link>
        <Link href="/parent/messages" className="text-blue-600 hover:underline">
          Messages
        </Link>
      </div>
    </main>
  );
}
