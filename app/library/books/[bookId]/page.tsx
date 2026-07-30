import { notFound } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { getAuthorizationContext, can } from "@/lib/auth/rbac";
import { getBook } from "@/modules/library/application/book.service";
import { listBookCopiesByBook } from "@/modules/library/application/book-copy.service";
import { listRacksByLibrary } from "@/modules/library/application/rack.service";
import { listShelvesByRack } from "@/modules/library/application/shelf.service";
import { BookCopyManager } from "@/components/features/library/BookCopyManager";

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export default async function BookDetailPage({ params }: PageProps) {
  const authContext = await requireAuthContext();
  const authorization = await getAuthorizationContext();
  const canManage = can(authorization, "library.inventory.manage");
  const { bookId } = await params;

  const book = await getBook(authContext.tenantId, bookId);
  if (!book) notFound();

  const copies = await listBookCopiesByBook(authContext.tenantId, bookId);
  const racks = await listRacksByLibrary(authContext.tenantId, book.libraryId, { isActive: true });
  const shelfLists = await Promise.all(racks.map((rack) => listShelvesByRack(authContext.tenantId, rack.id, { isActive: true })));
  const shelves = racks.flatMap((rack, index) =>
    shelfLists[index].map((shelf) => ({ id: shelf.id, label: `${rack.name} / ${shelf.name}` }))
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{book.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {book.language}
        {book.edition ? ` · ${book.edition} edition` : ""}
        {book.isbn ? ` · ISBN ${book.isbn}` : ""}
      </p>

      <div className="mt-6">
        <BookCopyManager bookId={bookId} items={copies} shelves={shelves} canManage={canManage} />
      </div>
    </main>
  );
}
