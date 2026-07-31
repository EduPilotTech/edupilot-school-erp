import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listExpenseCategories } from "@/modules/finance/application/expense-category.service";
import { ExpenseCategoryManager } from "@/components/features/finance/ExpenseCategoryManager";

export default async function ExpenseCategoriesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");

  const categories = await listExpenseCategories({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/finance" className="text-sm text-blue-600 hover:underline">
        ← Finance & Accounts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Expense Categories</h1>
      <p className="mt-1 text-sm text-zinc-500">The expense category master list used when recording expense (Salary, Electric Bill, ...).</p>

      <div className="mt-6">
        <ExpenseCategoryManager items={categories} canManage />
      </div>
    </main>
  );
}
