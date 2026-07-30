"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLibraryAction, updateLibraryAction, deleteLibraryAction } from "@/app/library/actions";
import type { LibraryDTO } from "@/modules/library/application/dto/library.dto";

interface LibraryManagerProps {
  items: LibraryDTO[];
  canManage: boolean;
}

// Library is school-scoped, session-independent master data — multiple branches are explicitly
// supported (requirement 1). Each row links to its Settings, Racks, and Books.
export function LibraryManager({ items, canManage }: LibraryManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createLibraryAction({ name, code, address: address || undefined });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setCode("");
      setAddress("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(library: LibraryDTO) {
    setEditingId(library.id);
    setError(null);
    try {
      const result = await updateLibraryAction(library.id, { isActive: !library.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(library: LibraryDTO) {
    setEditingId(library.id);
    setError(null);
    try {
      const result = await deleteLibraryAction(library.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="library-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="library-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Library"
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="library-code" className="text-xs font-medium text-zinc-500">
              Code
            </label>
            <input
              id="library-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LIB-01"
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="library-address" className="text-xs font-medium text-zinc-500">
              Address (optional)
            </label>
            <input
              id="library-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name || !code}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Library"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Links</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((library) => (
              <tr key={library.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{library.name}</td>
                <td className="px-4 py-2 text-zinc-700">{library.code}</td>
                <td className="px-4 py-2 text-zinc-700">{library.isActive ? "Active" : "Inactive"}</td>
                <td className="px-4 py-2">
                  <Link href={`/library/libraries/${library.id}/settings`} className="mr-3 text-sm text-blue-600 hover:underline">
                    Settings
                  </Link>
                  <Link href={`/library/racks?libraryId=${library.id}`} className="mr-3 text-sm text-blue-600 hover:underline">
                    Racks
                  </Link>
                  <Link href={`/library/books?libraryId=${library.id}`} className="text-sm text-blue-600 hover:underline">
                    Books
                  </Link>
                </td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(library)}
                      disabled={editingId === library.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {library.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(library)}
                      disabled={editingId === library.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No libraries yet.</p>}
      </div>
    </div>
  );
}
