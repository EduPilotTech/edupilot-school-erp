import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listAuthors } from "@/modules/library/application/author.service";
import { AuthorManager } from "@/components/features/library/AuthorManager";

export default async function AuthorsPage() {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const canManage = can(authorization, "library.catalog.manage");

  const authors = await listAuthors({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Authors</h1>
      <div className="mt-6">
        <AuthorManager items={authors} canManage={canManage} />
      </div>
    </main>
  );
}
