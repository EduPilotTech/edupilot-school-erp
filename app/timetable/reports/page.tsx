import Link from "next/link";
import "./timetable-print.css";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { listClassrooms } from "@/modules/academics/application/list-classrooms.service";
import { listTeachers } from "@/modules/teachers/application/list-teachers.service";
import { listWorkingDays } from "@/modules/timetable/application/list-working-days.service";
import { listPeriodConfigurations } from "@/modules/timetable/application/list-period-configurations.service";
import { getClassTimetable } from "@/modules/timetable/application/get-class-timetable.service";
import { getTeacherTimetable } from "@/modules/timetable/application/get-teacher-timetable.service";
import { getClassroomTimetable } from "@/modules/timetable/application/get-classroom-timetable.service";
import { TimetableReportView } from "@/components/features/timetable/TimetableReportView";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

interface TimetableReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type ReportType = "class" | "teacher" | "classroom";
const TABS: { type: ReportType; label: string }[] = [
  { type: "class", label: "Class Timetable" },
  { type: "teacher", label: "Teacher Timetable" },
  { type: "classroom", label: "Classroom Timetable" },
];

export default async function TimetableReportsPage({ searchParams }: TimetableReportsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("timetable.view");
  const authorization = await getAuthorizationContext();
  const canPrint = can(authorization, "timetable.print");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const type: ReportType = (["class", "teacher", "classroom"] as const).includes(first(params.type) as ReportType)
    ? (first(params.type) as ReportType)
    : "class";

  const academicSessionId = first(params.academicSessionId) ?? "";
  const classId = first(params.classId) ?? "";
  const sectionId = first(params.sectionId) ?? "";
  const teacherId = first(params.teacherId) ?? "";
  const classroomId = first(params.classroomId) ?? "";

  const [sessions, classes, sections, teachers, classrooms] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
    listTeachers({ tenantId: authContext.tenantId }),
    listClassrooms({ tenantId: authContext.tenantId }),
  ]);

  const hasClassScope = type === "class" && Boolean(academicSessionId && classId && sectionId);
  const hasTeacherScope = type === "teacher" && Boolean(academicSessionId && teacherId);
  const hasClassroomScope = type === "classroom" && Boolean(academicSessionId && classroomId);
  const hasScope = hasClassScope || hasTeacherScope || hasClassroomScope;

  let reportData: {
    title: string;
    subtitle: string;
    workingDays: string[];
    periods: { id: string; periodNumber: number; startTime: string; endTime: string; isBreak: boolean }[];
    entries: {
      dayOfWeek: string;
      periodNumber: number;
      subjectName: string;
      teacherName: string;
      className: string;
      sectionName: string;
      classroomName: string | null;
    }[];
    fileName: string;
    showClassColumn: boolean;
  } | null = null;

  if (hasScope) {
    const [workingDays, periods] = await Promise.all([
      listWorkingDays(academicSessionId, { tenantId: authContext.tenantId }),
      listPeriodConfigurations(academicSessionId, { tenantId: authContext.tenantId }),
    ]);
    const activeDays = DAY_ORDER.filter((day) => workingDays.find((d) => d.dayOfWeek === day)?.isWorking);

    if (hasClassScope) {
      const entries = await getClassTimetable(classId, sectionId, academicSessionId, {
        tenantId: authContext.tenantId,
      });
      const className = classes.find((c) => c.id === classId)?.name ?? "";
      const sectionName = sections.find((s) => s.id === sectionId)?.name ?? "";
      reportData = {
        title: `${className} ${sectionName} Timetable`,
        subtitle: "Class Timetable",
        workingDays: activeDays,
        periods,
        entries,
        fileName: `${className}-${sectionName}-timetable`,
        showClassColumn: false,
      };
    } else if (hasTeacherScope) {
      const entries = await getTeacherTimetable(teacherId, academicSessionId, { tenantId: authContext.tenantId });
      const teacherName = teachers.find((t) => t.id === teacherId)?.fullName ?? "";
      reportData = {
        title: `${teacherName} — Teacher Timetable`,
        subtitle: "Teacher Timetable",
        workingDays: activeDays,
        periods,
        entries,
        fileName: `${teacherName}-timetable`,
        showClassColumn: true,
      };
    } else if (hasClassroomScope) {
      const entries = await getClassroomTimetable(classroomId, academicSessionId, {
        tenantId: authContext.tenantId,
      });
      const classroomName = classrooms.find((c) => c.id === classroomId)?.name ?? "";
      reportData = {
        title: `${classroomName} — Classroom Timetable`,
        subtitle: "Classroom Timetable",
        workingDays: activeDays,
        periods,
        entries,
        fileName: `${classroomName}-timetable`,
        showClassColumn: true,
      };
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="timetable-screen-only flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Timetable Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">Teacher, class, and classroom timetables — printable and exportable.</p>
        </div>
        <Link
          href="/timetable/build"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Timetable Builder
        </Link>
      </div>

      <div className="timetable-screen-only mt-6 flex flex-wrap gap-2 border-b border-zinc-200">
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/timetable/reports?type=${tab.type}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              type === tab.type ? "border-b-2 border-blue-600 text-blue-700" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form method="get" className="timetable-screen-only mt-6 flex flex-wrap items-end gap-3">
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

        {type === "class" && (
          <>
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
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {type === "teacher" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="teacherId" className="text-xs font-medium text-zinc-500">
              Teacher
            </label>
            <select
              id="teacherId"
              name="teacherId"
              defaultValue={teacherId}
              required
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === "classroom" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="classroomId" className="text-xs font-medium text-zinc-500">
              Classroom
            </label>
            <select
              id="classroomId"
              name="classroomId"
              defaultValue={classroomId}
              required
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">Select classroom</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      <div className="mt-8">
        {!hasScope && <p className="timetable-screen-only text-sm text-zinc-500">Choose the filters above and click Load.</p>}
        {hasScope && reportData && (
          <TimetableReportView
            title={reportData.title}
            subtitle={reportData.subtitle}
            workingDays={reportData.workingDays}
            periods={reportData.periods}
            entries={reportData.entries}
            showClassColumn={reportData.showClassColumn}
            fileName={reportData.fileName}
            canPrint={canPrint}
          />
        )}
      </div>
    </main>
  );
}
