import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listFinanceAccounts } from "@/modules/finance/application/finance-account.service";
import { FinanceAccountManager } from "@/components/features/finance/FinanceAccountManager";

export default async function FinanceAccountsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("finance.master.manage");

  const accounts = await listFinanceAccounts(authContext.tenantId, authContext.schoolId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/finance" className="text-sm text-blue-600 hover:underline">
        ← Finance & Accounts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Finance Accounts</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The cash/bank ledger accounts Income and Expense entries are recorded against. Current balance is system-maintained.
      </p>

      <div className="mt-6">
        <FinanceAccountManager items={accounts} canManage />
      </div>
    </main>
  );
}
