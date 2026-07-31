import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listExpenseCategories } from "@/modules/finance/application/expense-category.service";
import { listFinanceAccounts } from "@/modules/finance/application/finance-account.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { ExpenseForm } from "@/components/features/finance/ExpenseForm";

// The symmetric counterpart of app/finance/income/new/page.tsx.
export default async function NewExpensePage() {
  const authContext = await requireAuthContext();
  await requirePermission("finance.expense.manage");

  const [sessions, categories, accounts] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listExpenseCategories({ tenantId: authContext.tenantId }, { isActive: true }),
    listFinanceAccounts(authContext.tenantId, authContext.schoolId, { isActive: true }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/finance/expense" className="text-sm text-blue-600 hover:underline">
        ← Expense
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Add Expense</h1>
        <p className="mt-1 text-sm text-zinc-500">Record a new expense entry against a finance account.</p>
      </div>

      <ExpenseForm sessions={sessions} categories={categories} accounts={accounts} />
    </main>
  );
}
