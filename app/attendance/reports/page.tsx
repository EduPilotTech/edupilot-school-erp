import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { getDailyAttendanceReport } from "@/modules/attendance/application/get-daily-attendance-report.service";
import { getClassAttendanceSummary } from "@/modules/attendance/application/get-class-attendance-summary.service";
import { getStudentAttendanceReport } from "@/modules/attendance/application/get-student-attendance-report.service";
import { DailyReportTable } from "@/components/features/attendance/DailyReportTable";
import { ClassSummaryTable } from "@/components/features/attendance/ClassSummaryTable";
import { StudentReportTable } from "@/components/features/attendance/StudentReportTable";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type ReportType = "daily" | "monthly" | "classwise" | "student";
const REPORT_TABS: { type: ReportType; label: string }[] = [
  { type: "daily", label: "Daily Report" },
  { type: "monthly", label: "Monthly Report" },
  { type: "classwise", label: "Class-wise Report" },
  { type: "student", label: "Student-wise Report" },
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthRange(month: string): { startDate: string; endDate: string } {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

// Reports UI: Daily, Monthly, Class-wise, and Student-wise, as one tabbed page rather than four
// separate routes — each tab is just a different filter shape over the same read services (see
// get-class-attendance-summary.service.ts's own comment: Monthly and Class-wise share ONE
// service, differing only in what date range this page computes and passes in). No Server
// Action anywhere on this page — every report is a pure read, called directly, matching
// app/students/page.tsx's established convention.
export default async function AttendanceReportsPage({ searchParams }: ReportsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("attendance.student.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const type: ReportType = (["daily", "monthly", "classwise", "student"] as const).includes(
    first(params.type) as ReportType
  )
    ? (first(params.type) as ReportType)
    : "daily";

  const academicSessionId = first(params.academicSessionId) ?? "";
  const classId = first(params.classId) ?? "";
  const sectionId = first(params.sectionId) ?? "";
  const date = first(params.date) ?? todayIsoDate();
  const month = first(params.month) ?? todayIsoDate().slice(0, 7);
  const startDate = first(params.startDate) ?? todayIsoDate();
  const endDate = first(params.endDate) ?? todayIsoDate();
  const search = first(params.search) ?? "";
  const studentId = first(params.studentId) ?? "";

  const [sessions, classes, sections] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
  ]);

  const hasClassScope = Boolean(academicSessionId && classId && sectionId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Attendance Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">Daily, monthly, class-wise, and student-wise attendance.</p>
        </div>
        <Link
          href="/attendance/mark"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Mark Attendance
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-zinc-200">
        {REPORT_TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/attendance/reports?type=${tab.type}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              type === tab.type
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {type !== "student" && (
        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <input type="hidden" name="type" value={type} />

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

          {type === "daily" && (
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
          )}

          {type === "monthly" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="month" className="text-xs font-medium text-zinc-500">
                Month
              </label>
              <input
                id="month"
                name="month"
                type="month"
                defaultValue={month}
                required
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
          )}

          {type === "classwise" && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="startDate" className="text-xs font-medium text-zinc-500">
                  From
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={startDate}
                  max={todayIsoDate()}
                  required
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="endDate" className="text-xs font-medium text-zinc-500">
                  To
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={endDate}
                  max={todayIsoDate()}
                  required
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Load Report
          </button>
        </form>
      )}

      {type === "student" && (
        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <input type="hidden" name="type" value="student" />
          <div className="flex flex-col gap-1">
            <label htmlFor="search" className="text-xs font-medium text-zinc-500">
              Search Student
            </label>
            <input
              id="search"
              name="search"
              defaultValue={search}
              placeholder="Admission # or name"
              className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="startDate" className="text-xs font-medium text-zinc-500">
              From
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={startDate}
              max={todayIsoDate()}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endDate" className="text-xs font-medium text-zinc-500">
              To
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={endDate}
              max={todayIsoDate()}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
          >
            Search
          </button>
        </form>
      )}

      <div className="mt-8">
        {type === "daily" && hasClassScope && (
          <DailyReportSection
            tenantId={authContext.tenantId}
            classId={classId}
            sectionId={sectionId}
            date={date}
          />
        )}
        {type === "daily" && !hasClassScope && (
          <p className="text-sm text-zinc-500">Choose a session, class, and section, then click Load Report.</p>
        )}

        {type === "monthly" && hasClassScope && (
          <ClassSummarySection tenantId={authContext.tenantId} classId={classId} sectionId={sectionId} {...currentMonthRange(month)} />
        )}
        {type === "monthly" && !hasClassScope && (
          <p className="text-sm text-zinc-500">Choose a session, class, and section, then click Load Report.</p>
        )}

        {type === "classwise" && hasClassScope && (
          <ClassSummarySection
            tenantId={authContext.tenantId}
            classId={classId}
            sectionId={sectionId}
            startDate={startDate}
            endDate={endDate}
          />
        )}
        {type === "classwise" && !hasClassScope && (
          <p className="text-sm text-zinc-500">Choose a session, class, and section, then click Load Report.</p>
        )}

        {type === "student" && (
          <StudentReportSection
            tenantId={authContext.tenantId}
            search={search}
            studentId={studentId}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </main>
  );
}

async function DailyReportSection({
  tenantId,
  classId,
  sectionId,
  date,
}: {
  tenantId: string;
  classId: string;
  sectionId: string;
  date: string;
}) {
  const report = await getDailyAttendanceReport({ classId, sectionId, date }, { tenantId }).catch(() => null);
  if (!report) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        Could not load this report — check that the selected class and section are valid.
      </p>
    );
  }

  return (
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
      <DailyReportTable rows={report.rows} />
    </>
  );
}

async function ClassSummarySection({
  tenantId,
  classId,
  sectionId,
  startDate,
  endDate,
}: {
  tenantId: string;
  classId: string;
  sectionId: string;
  startDate: string;
  endDate: string;
}) {
  const summary = await getClassAttendanceSummary({ classId, sectionId, startDate, endDate }, { tenantId }).catch(
    () => null
  );
  if (!summary) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        Could not load this report — check that the selected class and section are valid.
      </p>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-zinc-600">
        {startDate} to {endDate}
      </p>
      <ClassSummaryTable rows={summary.rows} />
    </>
  );
}

async function StudentReportSection({
  tenantId,
  search,
  studentId,
  startDate,
  endDate,
}: {
  tenantId: string;
  search: string;
  studentId: string;
  startDate: string;
  endDate: string;
}) {
  if (studentId) {
    const report = await getStudentAttendanceReport({ studentId, startDate, endDate }, { tenantId }).catch(
      () => null
    );
    if (!report) {
      return (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Could not load this student&apos;s report.
        </p>
      );
    }
    return (
      <>
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-zinc-600">
          <span>Present: {report.counts.PRESENT}</span>
          <span>Absent: {report.counts.ABSENT}</span>
          <span>Late: {report.counts.LATE}</span>
          <span>Half Day: {report.counts.HALF_DAY}</span>
          <span>Leave: {report.counts.LEAVE}</span>
          <span>Total Marked: {report.counts.total}</span>
        </div>
        <StudentReportTable entries={report.entries} />
      </>
    );
  }

  if (!search) {
    return <p className="text-sm text-zinc-500">Search for a student by admission number or name.</p>;
  }

  const results = await listStudents({ search, page: 1, pageSize: 10 }, { tenantId });
  if (results.items.length === 0) {
    return <p className="text-sm text-zinc-500">No students matched &quot;{search}&quot;.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
      {results.items.map((student) => (
        <li key={student.id}>
          <Link
            href={`/attendance/reports?type=student&studentId=${student.id}&startDate=${startDate}&endDate=${endDate}`}
            className="flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-50"
          >
            <span className="text-zinc-900">
              {student.firstName} {student.lastName}
            </span>
            <span className="text-zinc-500">{student.admissionNumber}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
