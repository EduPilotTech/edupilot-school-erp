import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission, getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listStudents } from "@/modules/students/application/list-students.service";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { listFeeStructures } from "@/modules/fees/application/list-fee-structures.service";
import { listFeeStructureItems } from "@/modules/fees/application/list-fee-structure-items.service";
import { listFeeInvoices } from "@/modules/fees/application/list-invoices.service";
import { InvoiceGenerationPanel } from "@/components/features/fees/InvoiceGenerationPanel";
import { InvoiceListTable } from "@/components/features/fees/InvoiceListTable";

interface BillingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("fee.invoice.view");
  const authorization = await getAuthorizationContext();

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const sessions = await listActiveAcademicSessions({ tenantId: authContext.tenantId });
  const academicSessionId = first(params.academicSessionId) || sessions[0]?.id || "";

  const structures = academicSessionId ? await listFeeStructures(authContext.tenantId, academicSessionId) : [];
  const itemsByStructure = await Promise.all(
    structures.map((structure) => listFeeStructureItems(authContext.tenantId, structure.id))
  );
  const allItems = itemsByStructure.flat();
  const oneTimeItems = allItems.filter((item) => item.frequency === "ONE_TIME");
  const installmentItems = allItems.filter((item) => item.frequency === "INSTALLMENT");

  const categories = await listFeeCategories({ tenantId: authContext.tenantId });
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? id;

  const studentResult = await listStudents({ page: 1, pageSize: 50 }, { tenantId: authContext.tenantId });
  const invoices = academicSessionId ? await listFeeInvoices(authContext.tenantId, { academicSessionId }) : [];
  const studentNameById = Object.fromEntries(
    studentResult.items.map((student) => [student.id, `${student.firstName} ${student.lastName}`])
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Billing</h1>
      <p className="mt-1 text-sm text-zinc-500">Generate invoices and review due status.</p>

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

      {academicSessionId && can(authorization, "fee.generate") && (
        <div className="mt-8">
          <InvoiceGenerationPanel
            academicSessionId={academicSessionId}
            oneTimeItems={oneTimeItems.map((item) => ({ id: item.id, label: categoryName(item.feeCategoryId) }))}
            installmentItems={installmentItems.map((item) => ({ id: item.id, label: categoryName(item.feeCategoryId) }))}
            students={studentResult.items.map((student) => ({
              id: student.id,
              label: `${student.admissionNumber} — ${student.firstName} ${student.lastName}`,
            }))}
          />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-base font-semibold text-zinc-900">Invoices</h2>
        <div className="mt-3">
          <InvoiceListTable
            invoices={invoices}
            studentNameById={studentNameById}
            canCancel={can(authorization, "fee.invoice.cancel")}
          />
        </div>
      </div>
    </main>
  );
}
