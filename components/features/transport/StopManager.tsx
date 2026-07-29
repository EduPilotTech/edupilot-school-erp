"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRouteStopAction, updateRouteStopAction, deleteRouteStopAction } from "@/app/transport/actions";
import type { RouteStopDTO } from "@/modules/transport/application/dto/route.dto";

interface StopManagerProps {
  routeId: string;
  items: RouteStopDTO[];
  canManage: boolean;
}

// RouteStop is ordered by sequenceOrder along the route — persists across sessions like Route
// itself (Decision 5).
export function StopManager({ routeId, items, canManage }: StopManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState(String(items.length + 1));
  const [pickupTime, setPickupTime] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createRouteStopAction({
        routeId,
        name,
        sequenceOrder: Number(sequenceOrder),
        pickupTime: pickupTime || undefined,
        dropTime: dropTime || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setSequenceOrder(String(items.length + 2));
      setPickupTime("");
      setDropTime("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(stop: RouteStopDTO) {
    setEditingId(stop.id);
    setError(null);
    try {
      const result = await updateRouteStopAction(stop.id, { isActive: !stop.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(stop: RouteStopDTO) {
    setEditingId(stop.id);
    setError(null);
    try {
      const result = await deleteRouteStopAction(stop.id);
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
            <label htmlFor="stop-order" className="text-xs font-medium text-zinc-500">
              Order
            </label>
            <input
              id="stop-order"
              type="number"
              min={1}
              value={sequenceOrder}
              onChange={(e) => setSequenceOrder(e.target.value)}
              className="w-16 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="stop-name" className="text-xs font-medium text-zinc-500">
              Stop Name
            </label>
            <input
              id="stop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Market"
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="stop-pickup" className="text-xs font-medium text-zinc-500">
              Pickup Time
            </label>
            <input
              id="stop-pickup"
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="stop-drop" className="text-xs font-medium text-zinc-500">
              Drop Time
            </label>
            <input
              id="stop-drop"
              type="time"
              value={dropTime}
              onChange={(e) => setDropTime(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name || !sequenceOrder}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Stop"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">#</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Stop</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Pickup</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Drop</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((stop) => (
              <tr key={stop.id}>
                <td className="px-4 py-2 text-zinc-700">{stop.sequenceOrder}</td>
                <td className="px-4 py-2 font-medium text-zinc-900">{stop.name}</td>
                <td className="px-4 py-2 text-zinc-700">{stop.pickupTime ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{stop.dropTime ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{stop.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(stop)}
                      disabled={editingId === stop.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {stop.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(stop)}
                      disabled={editingId === stop.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No stops yet.</p>}
      </div>
    </div>
  );
}
