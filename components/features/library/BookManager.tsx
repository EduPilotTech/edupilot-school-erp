"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBookAction, updateBookAction, deleteBookAction } from "@/app/library/actions";
import type { BookDTO, BookCategoryDTO, AuthorDTO, PublisherDTO } from "@/modules/library/application/dto/catalog.dto";

interface SubjectOption {
  id: string;
  name: string;
}

interface BookManagerProps {
  libraryId: string;
  items: BookDTO[];
  categories: BookCategoryDTO[];
  authors: AuthorDTO[];
  publishers: PublisherDTO[];
  subjects: SubjectOption[];
  canManage: boolean;
}

export function BookManager({ libraryId, items, categories, authors, publishers, subjects, canManage }: BookManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    isbn: "",
    language: "English",
    edition: "",
    description: "",
    replacementCost: 0,
    bookCategoryId: categories[0]?.id ?? "",
    authorId: authors[0]?.id ?? "",
    publisherId: publishers[0]?.id ?? "",
    academicSubjectId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createBookAction({
        libraryId,
        bookCategoryId: form.bookCategoryId,
        authorId: form.authorId,
        publisherId: form.publisherId,
        academicSubjectId: form.academicSubjectId || undefined,
        title: form.title,
        isbn: form.isbn || undefined,
        language: form.language,
        edition: form.edition || undefined,
        description: form.description || undefined,
        replacementCost: form.replacementCost,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setForm((prev) => ({ ...prev, title: "", isbn: "", edition: "", description: "", replacementCost: 0 }));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(book: BookDTO) {
    setEditingId(book.id);
    setError(null);
    try {
      const result = await updateBookAction(book.id, { isActive: !book.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(book: BookDTO) {
    setEditingId(book.id);
    setError(null);
    try {
      const result = await deleteBookAction(book.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  const categoryById = new Map(categories.map((c) => [c.id, c.name]));
  const authorById = new Map(authors.map((a) => [a.id, a.name]));

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="book-title" className="text-xs font-medium text-zinc-500">
              Title
            </label>
            <input
              id="book-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="book-isbn" className="text-xs font-medium text-zinc-500">
              ISBN (optional)
            </label>
            <input
              id="book-isbn"
              value={form.isbn}
              onChange={(e) => setField("isbn", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="book-language" className="text-xs font-medium text-zinc-500">
              Language
            </label>
            <input
              id="book-language"
              value={form.language}
              onChange={(e) => setField("language", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="book-edition" className="text-xs font-medium text-zinc-500">
              Edition (optional)
            </label>
            <input
              id="book-edition"
              value={form.edition}
              onChange={(e) => setField("edition", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="book-category" className="text-xs font-medium text-zinc-500">
              Category
            </label>
            <select
              id="book-category"
              value={form.bookCategoryId}
              onChange={(e) => setField("bookCategoryId", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="book-author" className="text-xs font-medium text-zinc-500">
              Author
            </label>
            <select
              id="book-author"
              value={form.authorId}
              onChange={(e) => setField("authorId", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="book-publisher" className="text-xs font-medium text-zinc-500">
              Publisher
            </label>
            <select
              id="book-publisher"
              value={form.publisherId}
              onChange={(e) => setField("publisherId", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {publishers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="book-subject" className="text-xs font-medium text-zinc-500">
              Academic Subject (optional — curriculum textbooks only)
            </label>
            <select
              id="book-subject"
              value={form.academicSubjectId}
              onChange={(e) => setField("academicSubjectId", e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">None</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="book-replacement-cost" className="text-xs font-medium text-zinc-500">
              Replacement Cost
            </label>
            <input
              id="book-replacement-cost"
              type="number"
              min={0}
              value={form.replacementCost}
              onChange={(e) => setField("replacementCost", Number(e.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-1">
            <label htmlFor="book-description" className="text-xs font-medium text-zinc-500">
              Description (optional)
            </label>
            <textarea
              id="book-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={2}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="lg:col-span-4">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting || !form.title || !form.bookCategoryId || !form.authorId || !form.publisherId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Adding…" : "Add Book"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Title</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Category</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Author</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((book) => (
              <tr key={book.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  <Link href={`/library/books/${book.id}`} className="text-blue-600 hover:underline">
                    {book.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-700">{categoryById.get(book.bookCategoryId) ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{authorById.get(book.authorId) ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{book.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(book)}
                      disabled={editingId === book.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {book.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(book)}
                      disabled={editingId === book.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No books in this library yet.</p>}
      </div>
    </div>
  );
}
