"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createClassroomAction,
  updateClassroomAction,
  deleteClassroomAction,
} from "@/app/academics/classrooms/actions";
import type { ClassroomDTO } from "@/modules/academics/application/dto/classroom.dto";

interface ClassroomManagerProps {
  items: ClassroomDTO[];
  canManage: boolean;
}

export function ClassroomManager({ items, canManage }: ClassroomManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createClassroomAction({ name, code, capacity: capacity ? Number(capacity) : undefined });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setCode("");
      setCapacity("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(classroom: ClassroomDTO) {
    setEditingId(classroom.id);
    setError(null);
    try {
      const result = await updateClassroomAction(classroom.id, { isActive: !classroom.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(classroom: ClassroomDTO) {
    setEditingId(classroom.id);
    setError(null);
    try {
      const result = await deleteClassroomAction(classroom.id);
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
            <label htmlFor="classroom-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="classroom-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lab 2"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="classroom-code" className="text-xs font-medium text-zinc-500">
              Code
            </label>
            <input
              id="classroom-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LAB2"
              className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="classroom-capacity" className="text-xs font-medium text-zinc-500">
              Capacity
            </label>
            <input
              id="classroom-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="40"
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name || !code}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Classroom"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Capacity</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((classroom) => (
              <tr key={classroom.id}>
                <td className="px-4 py-2 text-zinc-900">{classroom.name}</td>
                <td className="px-4 py-2 text-zinc-700">{classroom.code}</td>
                <td className="px-4 py-2 text-zinc-700">{classroom.capacity ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{classroom.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(classroom)}
                      disabled={editingId === classroom.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {classroom.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(classroom)}
                      disabled={editingId === classroom.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No classrooms yet.</p>}
      </div>
    </div>
  );
}
