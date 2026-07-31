"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmploymentTypeAction, updateEmploymentTypeAction, deleteEmploymentTypeAction } from "@/app/hr/actions";
import type { EmploymentTypeDTO } from "@/modules/hr/application/dto/hr-master.dto";

interface EmploymentTypeManagerProps {
  items: EmploymentTypeDTO[];
  canManage: boolean;
}

// Mirrors components/features/hostel/HostelBuildingManager.tsx exactly.
export function EmploymentTypeManager({ items, canManage }: EmploymentTypeManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createEmploymentTypeAction({ name, code });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setCode("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(employmentType: EmploymentTypeDTO) {
    setEditingId(employmentType.id);
    setError(null);
    try {
      const result = await updateEmploymentTypeAction(employmentType.id, { isActive: !employmentType.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(employmentType: EmploymentTypeDTO) {
    setEditingId(employmentType.id);
    setError(null);
    try {
      const result = await deleteEmploymentTypeAction(employmentType.id);
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
            <label htmlFor="employment-type-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="employment-type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Time"
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="employment-type-code" className="text-xs font-medium text-zinc-500">
              Code
            </label>
            <input
              id="employment-type-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="FT"
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name || !code}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Employment Type"}
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
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((employmentType) => (
              <tr key={employmentType.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{employmentType.name}</td>
                <td className="px-4 py-2 text-zinc-700">{employmentType.code}</td>
                <td className="px-4 py-2 text-zinc-700">{employmentType.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(employmentType)}
                      disabled={editingId === employmentType.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {employmentType.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(employmentType)}
                      disabled={editingId === employmentType.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No employment types yet.</p>}
      </div>
    </div>
  );
}
