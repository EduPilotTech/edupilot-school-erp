import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listIncomeCategories } from "@/modules/finance/application/income-category.service";
import { listFinanceAccounts } from "@/modules/finance/application/finance-account.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listUsers } from "@/modules/users/application/list-users.service";
import { IncomeForm } from "@/components/features/finance/IncomeForm";

// Server Component wrapper, mirroring app/hr/employees/new/page.tsx's shape: gathers every option
// list the form needs, then hands off to a Client Component. Real `finance.income.manage`
// enforcement lives on recordIncomeAction; this page-level check is a UX gate only.
export default async function NewIncomePage() {
  const authContext = await requireAuthContext();
  await requirePermission("finance.income.manage");

  const [sessions, categories, accounts, activeUsers] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listIncomeCategories({ tenantId: authContext.tenantId }, { isActive: true }),
    listFinanceAccounts(authContext.tenantId, authContext.schoolId, { isActive: true }),
    listUsers({ status: "ACTIVE", page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
  ]);

  const collectors = activeUsers.items
    .filter((user) => user.deletedAt === null)
    .map((user) => ({ id: user.id, fullName: user.fullName, email: user.email }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/finance/income" className="text-sm text-blue-600 hover:underline">
        ← Income
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Add Income</h1>
        <p className="mt-1 text-sm text-zinc-500">Record a new income entry against a finance account.</p>
      </div>

      <IncomeForm sessions={sessions} categories={categories} accounts={accounts} collectors={collectors} />
    </main>
  );
}
