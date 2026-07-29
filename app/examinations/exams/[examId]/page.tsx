import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSubjects } from "@/modules/academics/application/list-subjects.service";
import { getExam } from "@/modules/examinations/application/get-exam.service";
import { listExamSubjectsForExam } from "@/modules/examinations/application/list-exam-subjects.service";
import { ExamStatusControl } from "@/components/features/examinations/ExamStatusControl";
import { ExamSubjectManager } from "@/components/features/examinations/ExamSubjectManager";

interface ExamDetailPageProps {
  params: Promise<{ examId: string }>;
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("exam.view");
  const authorization = await getAuthorizationContext();
  const { examId } = await params;

  const [exam, examSubjects, classes, subjects] = await Promise.all([
    getExam(examId, { tenantId: authContext.tenantId }),
    listExamSubjectsForExam(examId, { tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSubjects({ tenantId: authContext.tenantId }),
  ]);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  const canManageExam = can(authorization, "exam.manage");
  const canManageSubjects =
    can(authorization, "exam.subject.manage") && (exam.status === "DRAFT" || exam.status === "SCHEDULED");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{exam.name}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {exam.startDate.toISOString().slice(0, 10)} – {exam.endDate.toISOString().slice(0, 10)}
      </p>

      <div className="mt-4">
        <ExamStatusControl examId={exam.id} status={exam.status} canManage={canManageExam} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-zinc-900">Subjects</h2>
      <div className="mt-3">
        <ExamSubjectManager
          examId={exam.id}
          rows={examSubjects.map((es) => ({
            id: es.id,
            classId: es.classId,
            className: classNameById.get(es.classId) ?? "Unknown Class",
            subjectId: es.subjectId,
            subjectName: subjectNameById.get(es.subjectId) ?? "Unknown Subject",
            maxMarks: es.maxMarks,
            passingMarks: es.passingMarks,
          }))}
          classOptions={classes.map((c) => ({ id: c.id, name: c.name }))}
          subjectOptions={subjects.map((s) => ({ id: s.id, name: s.name }))}
          canManage={canManageSubjects}
        />
      </div>
    </main>
  );
}
