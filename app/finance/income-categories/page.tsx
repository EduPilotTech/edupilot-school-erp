import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listIncomeCategories } from "@/modules/finance/application/income-category.service";
import { IncomeCategoryManager } from "@/components/features/finance/IncomeCategoryManager";

export default async function IncomeCategoriesPage() {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");

  const categories = await listIncomeCategories({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/finance" className="text-sm text-blue-600 hover:underline">
        ← Finance & Accounts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Income Categories</h1>
      <p className="mt-1 text-sm text-zinc-500">The income category master list used when recording income (Admission Fee, Tuition Fee, ...).</p>

      <div className="mt-6">
        <IncomeCategoryManager items={categories} canManage />
      </div>
    </main>
  );
}
