import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getExpense } from "@/modules/finance/application/expense.service";
import { listExpenseCategories } from "@/modules/finance/application/expense-category.service";
import { listFinanceAccounts } from "@/modules/finance/application/finance-account.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { ExpenseNotFoundError } from "@/modules/finance/domain/errors";
import { ValidationError } from "@/lib/errors";
import { ExpenseForm } from "@/components/features/finance/ExpenseForm";

interface EditExpensePageProps {
  params: Promise<{ expenseId: string }>;
}

// The symmetric counterpart of app/finance/income/[incomeId]/edit/page.tsx.
export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { expenseId } = await params;
  const authContext = await requireAuthContext();
  await requirePermission("finance.expense.manage");

  let expense;
  try {
    expense = await getExpense(authContext.tenantId, expenseId);
  } catch (error) {
    if (error instanceof ExpenseNotFoundError || error instanceof ValidationError) {
      notFound();
    }
    throw error;
  }

  // Unlike the "new" page, edit does not filter categories/accounts to isActive only — the
  // entry's existing category/account must always appear as a selectable option even if it has
  // since been deactivated, or the dropdown would silently drop the current selection.
  const [sessions, categories, accounts] = await Promise.all([
    listActiveAcademicSessions({ tenantId: authContext.tenantId }),
    listExpenseCategories({ tenantId: authContext.tenantId }),
    listFinanceAccounts(authContext.tenantId, authContext.schoolId),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/finance/expense" className="text-sm text-blue-600 hover:underline">
        ← Expense
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Expense</h1>
        <p className="mt-1 text-sm text-zinc-500">Update this expense entry.</p>
      </div>

      <ExpenseForm sessions={sessions} categories={categories} accounts={accounts} expense={expense} />
    </main>
  );
}
