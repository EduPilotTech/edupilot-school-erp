import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { searchGuardians } from "@/modules/parents/application/search-guardians.service";
import { GuardianLinkManager } from "@/components/features/parents/GuardianLinkManager";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ParentAccountsPage({ searchParams }: PageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("parent.account.link");

  const params = await searchParams;
  const search = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";

  const guardians = search ? await searchGuardians(authContext.tenantId, search) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Parent Portal Accounts</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Grant an existing guardian contact a parent-portal login. Sends an invitation email.
      </p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-zinc-500">
            Search Guardian
          </label>
          <input
            id="q"
            name="q"
            defaultValue={search}
            placeholder="Name, phone, or email"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Search
        </button>
      </form>

      <div className="mt-6">
        <GuardianLinkManager guardians={guardians} search={search} />
      </div>
    </main>
  );
}
