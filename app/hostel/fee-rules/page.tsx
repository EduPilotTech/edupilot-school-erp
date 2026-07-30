import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listHostels } from "@/modules/hostel/application/list-hostels.service";
import { listHostelFeeRules } from "@/modules/hostel/application/list-hostel-fee-rules.service";
import { listHostelResidentStudents } from "@/modules/hostel/application/list-hostel-resident-students.service";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { HostelFeeRuleManager } from "@/components/features/hostel/HostelFeeRuleManager";
import { HostelBillingPanel } from "@/components/features/hostel/HostelBillingPanel";

interface FeeRulesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HostelFeeRulesPage({ searchParams }: FeeRulesPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.fee-rule.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions.find((s) => s.isCurrent)?.id || sessions[0]?.id || "";
  const hostelIdFilter = first(params.hostelId);

  const [hostels, feeCategories, allRules, studentOptions] = await Promise.all([
    listHostels({ tenantId: authContext.tenantId }, { isActive: true }),
    listFeeCategories({ tenantId: authContext.tenantId }),
    academicSessionId ? listHostelFeeRules({ tenantId: authContext.tenantId }, academicSessionId) : Promise.resolve([]),
    academicSessionId ? listHostelResidentStudents(authContext.tenantId, academicSessionId) : Promise.resolve([]),
  ]);

  const rules = hostelIdFilter ? allRules.filter((rule) => rule.hostelId === hostelIdFilter) : allRules;
  const oneTimeRules = allRules.filter((rule) => rule.isActive && rule.frequency === "ONE_TIME");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Hostel Fee Rules &amp; Billing</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Room-type-wise hostel fee amounts, reused by the invoice generators below — every hostel
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
          <HostelFeeRuleManager
            academicSessionId={academicSessionId}
            items={rules}
            hostels={hostels}
            feeCategories={feeCategories}
            defaultHostelId={hostelIdFilter}
            canManage
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Generate Invoices</h2>
        <p className="mt-1 text-sm text-zinc-500">Monthly rules bill every resident; one-time rules bill one student at a time.</p>
        <div className="mt-3">
          <HostelBillingPanel academicSessionId={academicSessionId} oneTimeRules={oneTimeRules} studentOptions={studentOptions} />
        </div>
      </section>
    </main>
  );
}
