import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { getDailyAttendanceReport } from "@/modules/attendance/application/get-daily-attendance-report.service";
import { BulkMarkAttendanceForm } from "@/components/features/attendance/BulkMarkAttendanceForm";

interface MarkAttendancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// Daily Attendance + Bulk Mark Attendance + Class-wise Attendance, all in one page: pick a
// session/class/section/date (GET-form filtering, matching app/students/page.tsx's established
// pattern), then mark every student in that class/section for that day in one submit. The three
// requirement bullets describe one workflow, not three separate screens — see
// BulkMarkAttendanceForm's own comment for the same reasoning.
export default async function MarkAttendancePage({ searchParams }: MarkAttendancePageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("attendance.student.mark");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const academicSessionId = first(params.academicSessionId) ?? "";
  const classId = first(params.classId) ?? "";
  const sectionId = first(params.sectionId) ?? "";
  const date = first(params.date) ?? todayIsoDate();

  const [sessions, classes, sections] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
  ]);

  const canLoadRoster = Boolean(academicSessionId && classId && sectionId && date);

  const report = canLoadRoster
    ? await getDailyAttendanceReport({ classId, sectionId, date }, { tenantId: authContext.tenantId }).catch(
        () => null
      )
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Mark Attendance</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Select an academic session, class, section, and date to load the class roster.
          </p>
        </div>
        <Link
          href="/attendance/reports"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          View Reports
        </Link>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="classId" className="text-xs font-medium text-zinc-500">
            Class
          </label>
          <select
            id="classId"
            name="classId"
            defaultValue={classId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select class</option>
            {classes.map((classEntity) => (
              <option key={classEntity.id} value={classEntity.id}>
                {classEntity.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sectionId" className="text-xs font-medium text-zinc-500">
            Section
          </label>
          <select
            id="sectionId"
            name="sectionId"
            defaultValue={sectionId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
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
            max={todayIsoDate()}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load Roster
        </button>
      </form>

      <div className="mt-8">
        {!canLoadRoster && (
          <p className="text-sm text-zinc-500">
            Choose a session, class, section, and date above, then click Load Roster.
          </p>
        )}

        {canLoadRoster && !report && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            Could not load this roster — check that the selected session, class, and section are
            valid and belong to each other.
          </p>
        )}

        {report && (
          <>
            <div className="mb-4 flex flex-wrap gap-4 text-sm text-zinc-600">
              <span>Total: {report.rows.length}</span>
              <span>Present: {report.counts.PRESENT}</span>
              <span>Absent: {report.counts.ABSENT}</span>
              <span>Late: {report.counts.LATE}</span>
              <span>Half Day: {report.counts.HALF_DAY}</span>
              <span>Leave: {report.counts.LEAVE}</span>
              <span>Not Marked: {report.notMarkedCount}</span>
            </div>
            <BulkMarkAttendanceForm
              academicSessionId={academicSessionId}
              classId={classId}
              sectionId={sectionId}
              date={date}
              rows={report.rows}
            />
          </>
        )}
      </div>
    </main>
  );
}
