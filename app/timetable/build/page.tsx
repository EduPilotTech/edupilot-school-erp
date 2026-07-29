import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { listSubjects } from "@/modules/academics/application/list-subjects.service";
import { listClassrooms } from "@/modules/academics/application/list-classrooms.service";
import { listTeachers } from "@/modules/teachers/application/list-teachers.service";
import { listWorkingDays } from "@/modules/timetable/application/list-working-days.service";
import { listPeriodConfigurations } from "@/modules/timetable/application/list-period-configurations.service";
import { listAssignmentsForClass } from "@/modules/timetable/application/list-assignments.service";
import { getClassTimetable } from "@/modules/timetable/application/get-class-timetable.service";
import { TimetableBuilder } from "@/components/features/timetable/TimetableBuilder";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

interface TimetableBuildPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TimetableBuildPage({ searchParams }: TimetableBuildPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("timetable.manage");
  const authorization = await getAuthorizationContext();

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const academicSessionId = first(params.academicSessionId) ?? "";
  const classId = first(params.classId) ?? "";
  const sectionId = first(params.sectionId) ?? "";

  const [sessions, classes, sections] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
  ]);

  const hasScope = Boolean(academicSessionId && classId && sectionId);

  let gridData: {
    workingDays: string[];
    periods: { id: string; periodNumber: number; startTime: string; endTime: string; isBreak: boolean }[];
    entries: { id: string; dayOfWeek: string; periodNumber: number; subjectName: string; teacherName: string; classroomName: string | null }[];
    assignmentOptions: { id: string; label: string }[];
    classroomOptions: { id: string; name: string }[];
  } | null = null;

  if (hasScope) {
    const [workingDays, periods, assignments, entries, subjects, teachers, classrooms] = await Promise.all([
      listWorkingDays(academicSessionId, { tenantId: authContext.tenantId }),
      listPeriodConfigurations(academicSessionId, { tenantId: authContext.tenantId }),
      listAssignmentsForClass(classId, sectionId, academicSessionId, { tenantId: authContext.tenantId }),
      getClassTimetable(classId, sectionId, academicSessionId, { tenantId: authContext.tenantId }),
      listSubjects({ tenantId: authContext.tenantId }),
      listTeachers({ tenantId: authContext.tenantId }),
      listClassrooms({ tenantId: authContext.tenantId }),
    ]);

    const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
    const teacherNameById = new Map(teachers.map((t) => [t.id, t.fullName]));

    gridData = {
      workingDays: DAY_ORDER.filter((day) => workingDays.find((d) => d.dayOfWeek === day)?.isWorking),
      periods,
      entries,
      assignmentOptions: assignments.map((assignment) => ({
        id: assignment.id,
        label: `${subjectNameById.get(assignment.subjectId) ?? "Unknown Subject"} — ${
          teacherNameById.get(assignment.teacherId) ?? "Unknown Teacher"
        }`,
      })),
      classroomOptions: classrooms.map((c) => ({ id: c.id, name: c.name })),
    };
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Timetable Builder</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Select a session, class, and section to build its weekly timetable.
      </p>

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
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load Timetable
        </button>
      </form>

      <div className="mt-8">
        {!hasScope && <p className="text-sm text-zinc-500">Choose a session, class, and section above.</p>}

        {hasScope && gridData && gridData.periods.length === 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            No period configuration exists for this session yet. Set it up in School Configuration first.
          </p>
        )}

        {hasScope && gridData && gridData.periods.length > 0 && (
          <TimetableBuilder
            workingDays={gridData.workingDays}
            periods={gridData.periods}
            entries={gridData.entries}
            assignmentOptions={gridData.assignmentOptions}
            classroomOptions={gridData.classroomOptions}
            canManage={can(authorization, "timetable.manage")}
          />
        )}
      </div>
    </main>
  );
}
