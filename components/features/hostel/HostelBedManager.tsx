"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createHostelBedAction,
  setHostelBedMaintenanceAction,
  deleteHostelBedAction,
} from "@/app/hostel/actions";
import type { HostelBedDTO } from "@/modules/hostel/application/dto/hostel-structure.dto";

interface HostelBedManagerProps {
  roomId: string;
  items: HostelBedDTO[];
  canManage: boolean;
}

export function HostelBedManager({ roomId, items, canManage }: HostelBedManagerProps) {
  const router = useRouter();
  const [bedNumber, setBedNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createHostelBedAction({ roomId, bedNumber });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setBedNumber("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleMaintenance(bed: HostelBedDTO) {
    setEditingId(bed.id);
    setError(null);
    try {
      const result = await setHostelBedMaintenanceAction(bed.id, bed.status !== "MAINTENANCE");
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(bed: HostelBedDTO) {
    setEditingId(bed.id);
    setError(null);
    try {
      const result = await deleteHostelBedAction(bed.id);
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
            <label htmlFor="bed-number" className="text-xs font-medium text-zinc-500">
              Bed Number
            </label>
            <input
              id="bed-number"
              value={bedNumber}
              onChange={(e) => setBedNumber(e.target.value)}
              placeholder="A"
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !bedNumber}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Bed"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Bed #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((bed) => (
              <tr key={bed.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{bed.bedNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{bed.status}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    {bed.status !== "OCCUPIED" && (
                      <button
                        type="button"
                        onClick={() => handleToggleMaintenance(bed)}
                        disabled={editingId === bed.id}
                        className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {bed.status === "MAINTENANCE" ? "Mark Available" : "Mark Maintenance"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(bed)}
                      disabled={editingId === bed.id || bed.status === "OCCUPIED"}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No beds yet.</p>}
      </div>
    </div>
  );
}
