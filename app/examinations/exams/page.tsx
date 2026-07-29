import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listExamTypes } from "@/modules/examinations/application/list-exam-types.service";
import { listExams } from "@/modules/examinations/application/list-exams.service";
import { ExamCreateForm } from "@/components/features/examinations/ExamCreateForm";

interface ExamsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExamsPage({ searchParams }: ExamsPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("exam.view");
  const authorization = await getAuthorizationContext();

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const [sessions, examTypes] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listExamTypes({ tenantId: authContext.tenantId }),
  ]);
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";

  const exams = academicSessionId ? await listExams(academicSessionId, { tenantId: authContext.tenantId }) : [];
  const canManage = can(authorization, "exam.manage");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Exams</h1>
      <p className="mt-1 text-sm text-zinc-500">Each exam moves through DRAFT → SCHEDULED → ONGOING → MARKS_ENTRY_COMPLETED → RESULT_GENERATED → RESULT_PUBLISHED.</p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="academicSessionId" className="text-xs font-medium text-zinc-500">
            Academic Session
          </label>
          <select
            id="academicSessionId"
            name="academicSessionId"
            defaultValue={academicSessionId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Switch Session
        </button>
      </form>

      {canManage && academicSessionId && (
        <div className="mt-6">
          <ExamCreateForm academicSessionId={academicSessionId} examTypeOptions={examTypes.map((t) => ({ id: t.id, name: t.name }))} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Dates</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td className="px-4 py-2 text-zinc-900">{exam.name}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {exam.startDate.toISOString().slice(0, 10)} – {exam.endDate.toISOString().slice(0, 10)}
                </td>
                <td className="px-4 py-2 text-zinc-700">{exam.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/examinations/exams/${exam.id}`} className="text-sm text-blue-600 hover:underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exams.length === 0 && <p className="p-4 text-sm text-zinc-500">No exams yet for this session.</p>}
      </div>
    </main>
  );
}
