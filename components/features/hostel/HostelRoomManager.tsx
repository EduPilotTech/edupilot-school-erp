"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createHostelRoomAction, updateHostelRoomAction, deleteHostelRoomAction } from "@/app/hostel/actions";
import type { HostelRoomDTO } from "@/modules/hostel/application/dto/hostel-structure.dto";
import type { HostelWingDTO } from "@/modules/hostel/application/dto/hostel-structure.dto";

interface HostelRoomManagerProps {
  floorId: string;
  items: HostelRoomDTO[];
  wings: HostelWingDTO[];
  canManage: boolean;
}

const ROOM_TYPES = ["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY", "OTHER"];
const ROOM_GENDERS = ["BOYS", "GIRLS", "CO_ED"];
const ROOM_STATUSES = ["ACTIVE", "MAINTENANCE", "INACTIVE"];

export function HostelRoomManager({ floorId, items, wings, canManage }: HostelRoomManagerProps) {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("DOUBLE");
  const [capacity, setCapacity] = useState("2");
  const [gender, setGender] = useState("CO_ED");
  const [wingId, setWingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createHostelRoomAction({
        floorId,
        wingId: wingId || undefined,
        roomNumber,
        roomType,
        capacity: Number(capacity),
        gender,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setRoomNumber("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(room: HostelRoomDTO, status: string) {
    setEditingId(room.id);
    setError(null);
    try {
      const result = await updateHostelRoomAction(room.id, { status });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(room: HostelRoomDTO) {
    setEditingId(room.id);
    setError(null);
    try {
      const result = await deleteHostelRoomAction(room.id);
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
            <label htmlFor="room-number" className="text-xs font-medium text-zinc-500">
              Room #
            </label>
            <input
              id="room-number"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="101"
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="room-type" className="text-xs font-medium text-zinc-500">
              Type
            </label>
            <select
              id="room-type"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="room-capacity" className="text-xs font-medium text-zinc-500">
              Capacity
            </label>
            <input
              id="room-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-20 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="room-gender" className="text-xs font-medium text-zinc-500">
              Gender
            </label>
            <select
              id="room-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {ROOM_GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g.replace("_", "-")}
                </option>
              ))}
            </select>
          </div>
          {wings.length > 0 && (
            <div className="flex flex-col gap-1">
              <label htmlFor="room-wing" className="text-xs font-medium text-zinc-500">
                Wing (optional)
              </label>
              <select
                id="room-wing"
                value={wingId}
                onChange={(e) => setWingId(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                {wings.map((wing) => (
                  <option key={wing.id} value={wing.id}>
                    {wing.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !roomNumber || !capacity}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Room"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Room #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Capacity</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Gender</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((room) => (
              <tr key={room.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  <Link href={`/hostel/rooms/${room.id}`} className="text-blue-600 hover:underline">
                    {room.roomNumber}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-700">{room.roomType}</td>
                <td className="px-4 py-2 text-zinc-700">{room.capacity}</td>
                <td className="px-4 py-2 text-zinc-700">{room.gender.replace("_", "-")}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {canManage ? (
                    <select
                      value={room.status}
                      disabled={editingId === room.id}
                      onChange={(e) => handleStatusChange(room, e.target.value)}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                    >
                      {ROOM_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    room.status
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(room)}
                      disabled={editingId === room.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No rooms yet.</p>}
      </div>
    </div>
  );
}
