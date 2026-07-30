import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listBookCategories } from "@/modules/library/application/book-category.service";
import { BookCategoryManager } from "@/components/features/library/BookCategoryManager";

export default async function BookCategoriesPage() {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const canManage = can(authorization, "library.catalog.manage");

  const categories = await listBookCategories({ tenantId: authContext.tenantId });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Book Categories</h1>
      <p className="mt-1 text-sm text-zinc-500">School-wide catalog lookup, shared across every library branch.</p>
      <div className="mt-6">
        <BookCategoryManager items={categories} canManage={canManage} />
      </div>
    </main>
  );
}
