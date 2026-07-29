import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listRoutes } from "@/modules/transport/application/list-routes.service";
import { listRouteFeeRules } from "@/modules/transport/application/list-route-fee-rules.service";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { RouteFeeRuleManager } from "@/components/features/transport/RouteFeeRuleManager";
import { TransportBillingPanel } from "@/components/features/transport/TransportBillingPanel";

interface FeeRulesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TransportFeeRulesPage({ searchParams }: FeeRulesPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("transport.fee-rule.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";
  const routeIdFilter = first(params.routeId);

  const routes = await listRoutes({ tenantId: authContext.tenantId }, { isActive: true });
  const feeCategories = await listFeeCategories({ tenantId: authContext.tenantId });
  const allRules = academicSessionId ? await listRouteFeeRules({ tenantId: authContext.tenantId }, academicSessionId) : [];
  const rules = routeIdFilter ? allRules.filter((rule) => rule.routeId === routeIdFilter) : allRules;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Route Fee Rules &amp; Billing</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Route-wise transport fee amounts, reused by the invoice generator below — every transport
        charge is a real invoice in the Fee module, using the same collection, receipts, and ledger.
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

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Fee Rules</h2>
        <div className="mt-3">
          <RouteFeeRuleManager
            academicSessionId={academicSessionId}
            items={rules}
            routes={routes}
            feeCategories={feeCategories}
            defaultRouteId={routeIdFilter}
            canManage
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Generate Invoices</h2>
        <p className="mt-1 text-sm text-zinc-500">Monthly rules only — one invoice per student per route per period.</p>
        <div className="mt-3">
          <TransportBillingPanel academicSessionId={academicSessionId} />
        </div>
      </section>
    </main>
  );
}
