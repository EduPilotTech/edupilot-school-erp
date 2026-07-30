"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHostelWingAction, updateHostelWingAction, deleteHostelWingAction } from "@/app/hostel/actions";
import type { HostelWingDTO } from "@/modules/hostel/application/dto/hostel-structure.dto";

interface HostelWingManagerProps {
  buildingId: string;
  items: HostelWingDTO[];
  canManage: boolean;
}

// Wing is an optional building-level grouping — not every hostel has wings, hence no drill-down
// link (unlike Floor, which every Room must belong to).
export function HostelWingManager({ buildingId, items, canManage }: HostelWingManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createHostelWingAction({ buildingId, name });
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

  async function handleToggleActive(wing: HostelWingDTO) {
    setEditingId(wing.id);
    setError(null);
    try {
      const result = await updateHostelWingAction(wing.id, { isActive: !wing.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(wing: HostelWingDTO) {
    setEditingId(wing.id);
    setError(null);
    try {
      const result = await deleteHostelWingAction(wing.id);
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
            <label htmlFor="wing-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="wing-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="East Wing"
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Wing"}
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
            {items.map((wing) => (
              <tr key={wing.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{wing.name}</td>
                <td className="px-4 py-2 text-zinc-700">{wing.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(wing)}
                      disabled={editingId === wing.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {wing.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(wing)}
                      disabled={editingId === wing.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No wings yet.</p>}
      </div>
    </div>
  );
}
