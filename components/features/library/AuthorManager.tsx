"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAuthorAction, updateAuthorAction, deleteAuthorAction } from "@/app/library/actions";
import type { AuthorDTO } from "@/modules/library/application/dto/catalog.dto";

interface AuthorManagerProps {
  items: AuthorDTO[];
  canManage: boolean;
}

export function AuthorManager({ items, canManage }: AuthorManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createAuthorAction({ name });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(author: AuthorDTO) {
    setEditingId(author.id);
    setError(null);
    try {
      const result = await updateAuthorAction(author.id, { isActive: !author.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(author: AuthorDTO) {
    setEditingId(author.id);
    setError(null);
    try {
      const result = await deleteAuthorAction(author.id);
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
            <label htmlFor="author-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="author-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Austen"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Author"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((author) => (
              <tr key={author.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{author.name}</td>
                <td className="px-4 py-2 text-zinc-700">{author.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(author)}
                      disabled={editingId === author.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {author.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(author)}
                      disabled={editingId === author.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No authors yet.</p>}
      </div>
    </div>
  );
}
