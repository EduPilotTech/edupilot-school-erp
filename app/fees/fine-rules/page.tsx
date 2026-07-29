import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { listFineRules } from "@/modules/fees/application/list-fine-rules.service";
import { FineRuleManager } from "@/components/features/fees/FineRuleManager";

interface FineRulesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FineRulesPage({ searchParams }: FineRulesPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("feestructure.view");
  const authorization = await getAuthorizationContext();

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";

  const rules = academicSessionId ? await listFineRules(authContext.tenantId, academicSessionId) : [];
  const categories = await listFeeCategories({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Fine Rules</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Late-payment fine policies. Fines are computed live and only recorded once collected.
      </p>

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
          <FineRuleManager
            academicSessionId={academicSessionId}
            rules={rules}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            canManage={can(authorization, "fee.finerule.manage")}
          />
        ) : (
          <p className="text-sm text-zinc-500">No active academic session found.</p>
        )}
      </div>
    </main>
  );
}
