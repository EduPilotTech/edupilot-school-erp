import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listGradeScales } from "@/modules/examinations/application/list-grade-scales.service";
import { GradeScaleManager } from "@/components/features/grading/GradeScaleManager";

interface GradingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GradingPage({ searchParams }: GradingPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("grade.view");
  const authorization = await getAuthorizationContext();

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";

  const scales = academicSessionId
    ? await listGradeScales(academicSessionId, { tenantId: authContext.tenantId })
    : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Grading</h1>
      <p className="mt-1 text-sm text-zinc-500">The percentage-to-grade scale used for result generation.</p>

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

      <div className="mt-8">
        {academicSessionId ? (
          <GradeScaleManager
            academicSessionId={academicSessionId}
            scales={scales}
            canManage={can(authorization, "grade.manage")}
          />
        ) : (
          <p className="text-sm text-zinc-500">No active academic session found.</p>
        )}
      </div>
    </main>
  );
}
