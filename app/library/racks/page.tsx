import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listLibraries } from "@/modules/library/application/library.service";
import { listRacksByLibrary } from "@/modules/library/application/rack.service";
import { RackManager } from "@/components/features/library/RackManager";

interface RacksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RacksPage({ searchParams }: RacksPageProps) {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const canManage = can(authorization, "library.inventory.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const libraries = await listLibraries({ tenantId: authContext.tenantId }, { isActive: true });
  const libraryId = first(params.libraryId) || libraries[0]?.id || "";

  const racks = libraryId ? await listRacksByLibrary(authContext.tenantId, libraryId) : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Racks</h1>
      <p className="mt-1 text-sm text-zinc-500">Physical storage, level 1 — each rack holds several shelves.</p>

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
        {libraryId ? (
          <RackManager libraryId={libraryId} items={racks} canManage={canManage} />
        ) : (
          <p className="text-sm text-zinc-500">Create a library first.</p>
        )}
      </div>
    </main>
  );
}
