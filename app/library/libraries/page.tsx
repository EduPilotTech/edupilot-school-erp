import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listLibraries } from "@/modules/library/application/library.service";
import { LibraryManager } from "@/components/features/library/LibraryManager";

export default async function LibrariesPage() {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const canManage = can(authorization, "library.manage");

  const libraries = await listLibraries({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Libraries</h1>
      <p className="mt-1 text-sm text-zinc-500">Branches — multiple libraries per school are supported.</p>
      <div className="mt-6">
        <LibraryManager items={libraries} canManage={canManage} />
      </div>
    </main>
  );
}
