import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { listSubjects } from "@/modules/academics/application/list-subjects.service";
import { listExams } from "@/modules/examinations/application/list-exams.service";
import { listExamSubjectsForExamAndClass } from "@/modules/examinations/application/list-exam-subjects.service";
import { listMarksForExamSubject } from "@/modules/examinations/application/list-marks-for-exam-subject.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { MarksEntryGrid } from "@/components/features/examinations/MarksEntryGrid";

interface MarksEntryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MarksEntryPage({ searchParams }: MarksEntryPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("marks.entry");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const academicSessionId = first(params.academicSessionId) ?? "";
  const examId = first(params.examId) ?? "";
  const classId = first(params.classId) ?? "";
  const sectionId = first(params.sectionId) ?? "";
  const examSubjectId = first(params.examSubjectId) ?? "";

  const [sessions, classes, sections, subjects] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
    listSubjects({ tenantId: authContext.tenantId }),
  ]);
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  const exams = academicSessionId ? await listExams(academicSessionId, { tenantId: authContext.tenantId }) : [];
  const examSubjects =
    examId && classId
      ? await listExamSubjectsForExamAndClass(examId, classId, { tenantId: authContext.tenantId })
      : [];

  const hasScope = Boolean(examSubjectId && classId && sectionId);
  const examSubject = examSubjects.find((es) => es.id === examSubjectId);

  const gridData = hasScope
    ? await (async () => {
        const [roster, marks] = await Promise.all([
          listStudents({ classId, sectionId, page: 1, pageSize: 500 }, { tenantId: authContext.tenantId }),
          listMarksForExamSubject(examSubjectId, { tenantId: authContext.tenantId }),
        ]);
        const marksByStudentId = new Map(marks.map((entry) => [entry.studentId, entry]));
        return roster.items.map((student) => {
          const existing = marksByStudentId.get(student.id);
          return {
            studentId: student.id,
            admissionNumber: student.admissionNumber,
            fullName: `${student.firstName} ${student.lastName}`,
            marksObtained: existing?.marksObtained ?? null,
            isAbsent: existing?.isAbsent ?? false,
          };
        });
      })()
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Marks Entry</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Marks can only be entered while an exam is ONGOING. Teachers may only enter marks for subjects they are assigned to teach.
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
          <label htmlFor="examId" className="text-xs font-medium text-zinc-500">
            Exam
          </label>
          <select
            id="examId"
            name="examId"
            defaultValue={examId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({exam.status})
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
        <div className="flex flex-col gap-1">
          <label htmlFor="examSubjectId" className="text-xs font-medium text-zinc-500">
            Exam Subject
          </label>
          <select
            id="examSubjectId"
            name="examSubjectId"
            defaultValue={examSubjectId}
            required
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select subject</option>
            {examSubjects.map((es) => (
              <option key={es.id} value={es.id}>
                {subjectNameById.get(es.subjectId) ?? "Unknown Subject"} ({es.maxMarks} marks)
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load Roster
        </button>
      </form>

      <div className="mt-8">
        {!hasScope && <p className="text-sm text-zinc-500">Choose the filters above, then click Load Roster.</p>}
        {hasScope && gridData && examSubject && (
          <MarksEntryGrid
            examSubjectId={examSubjectId}
            maxMarks={examSubject.maxMarks}
            passingMarks={examSubject.passingMarks}
            rows={gridData}
          />
        )}
      </div>
    </main>
  );
}
