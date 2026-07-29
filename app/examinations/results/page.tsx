import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listClasses } from "@/modules/academics/application/list-classes.service";
import { listSections } from "@/modules/academics/application/list-sections.service";
import { listExams } from "@/modules/examinations/application/list-exams.service";
import { getExamRanking } from "@/modules/examinations/application/get-exam-ranking.service";
import { ResultActionsPanel } from "@/components/features/examinations/ResultActionsPanel";
import { RankingTable } from "@/components/features/examinations/RankingTable";

interface ResultsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("result.view");
  const authorization = await getAuthorizationContext();

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const academicSessionId = first(params.academicSessionId) ?? "";
  const examId = first(params.examId) ?? "";
  const classId = first(params.classId) ?? "";
  const sectionId = first(params.sectionId) ?? "";

  const [sessions, classes, sections] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listClasses({ tenantId: authContext.tenantId }),
    listSections({ tenantId: authContext.tenantId }),
  ]);

  const exams = academicSessionId ? await listExams(academicSessionId, { tenantId: authContext.tenantId }) : [];
  const selectedExam = exams.find((exam) => exam.id === examId);

  const hasRankingScope = Boolean(examId && classId && sectionId);
  const ranking = hasRankingScope
    ? await getExamRanking(examId, classId, sectionId, { tenantId: authContext.tenantId })
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Results</h1>
      <p className="mt-1 text-sm text-zinc-500">Generate results, then publish to lock them in and make report cards available.</p>

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
                {exam.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Load
        </button>
      </form>

      {selectedExam && (
        <div className="mt-6">
          <ResultActionsPanel
            examId={selectedExam.id}
            status={selectedExam.status}
            canGenerate={can(authorization, "result.generate")}
            canPublish={can(authorization, "result.publish")}
          />
        </div>
      )}

      {selectedExam && (
        <>
          <h2 className="mt-8 text-lg font-semibold text-zinc-900">Ranking</h2>
          <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="academicSessionId" value={academicSessionId} />
            <input type="hidden" name="examId" value={examId} />
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
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              Load Ranking
            </button>
          </form>

          <div className="mt-4">
            {hasRankingScope && ranking ? (
              <RankingTable rows={ranking} />
            ) : (
              <p className="text-sm text-zinc-500">Choose a class and section to see the ranking.</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
