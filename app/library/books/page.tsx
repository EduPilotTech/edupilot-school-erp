import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { listLibraries } from "@/modules/library/application/library.service";
import { listBooksByLibrary } from "@/modules/library/application/book.service";
import { listBookCategories } from "@/modules/library/application/book-category.service";
import { listAuthors } from "@/modules/library/application/author.service";
import { listPublishers } from "@/modules/library/application/publisher.service";
import { listSubjects } from "@/modules/academics/application/list-subjects.service";
import { BookManager } from "@/components/features/library/BookManager";

interface BooksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const canManage = can(authorization, "library.catalog.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const libraries = await listLibraries({ tenantId: authContext.tenantId }, { isActive: true });
  const libraryId = first(params.libraryId) || libraries[0]?.id || "";

  const [books, categories, authors, publishers, subjects] = await Promise.all([
    libraryId ? listBooksByLibrary(authContext.tenantId, libraryId) : Promise.resolve([]),
    listBookCategories({ tenantId: authContext.tenantId }, { isActive: true }),
    listAuthors({ tenantId: authContext.tenantId }, { isActive: true }),
    listPublishers({ tenantId: authContext.tenantId }, { isActive: true }),
    listSubjects({ tenantId: authContext.tenantId }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Books &amp; Copies</h1>
      <p className="mt-1 text-sm text-zinc-500">Catalog for one library branch at a time.</p>

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
          <BookManager
            libraryId={libraryId}
            items={books}
            categories={categories}
            authors={authors}
            publishers={publishers}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            canManage={canManage}
          />
        ) : (
          <p className="text-sm text-zinc-500">Create a library first.</p>
        )}
      </div>
    </main>
  );
}
