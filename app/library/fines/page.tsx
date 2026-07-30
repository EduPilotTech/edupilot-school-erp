import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listLibraries } from "@/modules/library/application/library.service";
import { listFineCandidates } from "@/modules/library/application/library-fine.service";
import { listFeeCategories } from "@/modules/fees/application/list-fee-categories.service";
import { FinePanel } from "@/components/features/library/FinePanel";

interface FinesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FinesPage({ searchParams }: FinesPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("library.fine.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const libraries = await listLibraries({ tenantId: authContext.tenantId }, { isActive: true });
  const libraryId = first(params.libraryId) || libraries[0]?.id || "";

  const [candidates, feeCategories] = await Promise.all([
    libraryId ? listFineCandidates(authContext.tenantId, libraryId) : Promise.resolve([]),
    listFeeCategories({ tenantId: authContext.tenantId }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Fine Management</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Late fines reuse the Fee module&apos;s FineRule; Lost/Damaged fines default to the book&apos;s replacement cost.
        Every amount can be overridden or waived by an administrator.
      </p>

      <form method="get" className="mt-6 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="libraryId" className="text-xs font-medium text-zinc-500">
            Library
          </label>
          <select
            id="libraryId"
            name="libraryId"
            defaultValue={libraryId}
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {libraries.map((library) => (
              <option key={library.id} value={library.id}>
                {library.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Switch Library
        </button>
      </form>

      <div className="mt-6">
        <FinePanel items={candidates} feeCategories={feeCategories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </main>
  );
}
