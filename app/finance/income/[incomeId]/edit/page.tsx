import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getIncome } from "@/modules/finance/application/income.service";
import { listIncomeCategories } from "@/modules/finance/application/income-category.service";
import { listFinanceAccounts } from "@/modules/finance/application/finance-account.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { listUsers } from "@/modules/users/application/list-users.service";
import { IncomeNotFoundError } from "@/modules/finance/domain/errors";
import { ValidationError } from "@/lib/errors";
import { IncomeForm } from "@/components/features/finance/IncomeForm";

interface EditIncomePageProps {
  params: Promise<{ incomeId: string }>;
}

// Mirrors app/hr/employees/[employeeId]/edit/page.tsx's exact shape: notFound() on a missing/
// invalid id, then gather every option list IncomeForm needs.
export default async function EditIncomePage({ params }: EditIncomePageProps) {
  const { incomeId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("finance.income.manage");

  let income;
  try {
    income = await getIncome(authContext.tenantId, incomeId);
  } catch (error) {
    if (error instanceof IncomeNotFoundError || error instanceof ValidationError) {
      notFound();
    }
    throw error;
  }

  // Unlike the "new" page, edit does not filter categories/accounts to isActive only — the
  // entry's existing category/account must always appear as a selectable option even if it has
  // since been deactivated, or the dropdown would silently drop the current selection.
  const [sessions, categories, accounts, activeUsers] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listIncomeCategories({ tenantId: authContext.tenantId }),
    listFinanceAccounts(authContext.tenantId, authContext.schoolId),
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
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Income</h1>
        <p className="mt-1 text-sm text-zinc-500">Update this income entry.</p>
      </div>

      <IncomeForm sessions={sessions} categories={categories} accounts={accounts} collectors={collectors} income={income} />
    </main>
  );
}
