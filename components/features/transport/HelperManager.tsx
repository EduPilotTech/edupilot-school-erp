"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHelperAction, updateHelperAction, deleteHelperAction } from "@/app/transport/actions";
import type { HelperDTO } from "@/modules/transport/application/dto/helper.dto";

interface HelperManagerProps {
  items: HelperDTO[];
  canManage: boolean;
}

export function HelperManager({ items, canManage }: HelperManagerProps) {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createHelperAction({ employeeCode, fullName, phone: phone || undefined });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setEmployeeCode("");
      setFullName("");
      setPhone("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(helper: HelperDTO) {
    setEditingId(helper.id);
    setError(null);
    try {
      const result = await updateHelperAction(helper.id, { isActive: !helper.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(helper: HelperDTO) {
    setEditingId(helper.id);
    setError(null);
    try {
      const result = await deleteHelperAction(helper.id);
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
            <label htmlFor="helper-code" className="text-xs font-medium text-zinc-500">
              Employee Code
            </label>
            <input
              id="helper-code"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="HLP-001"
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="helper-name" className="text-xs font-medium text-zinc-500">
              Full Name
            </label>
            <input
              id="helper-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="helper-phone" className="text-xs font-medium text-zinc-500">
              Phone
            </label>
            <input
              id="helper-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !employeeCode || !fullName}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Helper"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Phone</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((helper) => (
              <tr key={helper.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{helper.employeeCode}</td>
                <td className="px-4 py-2 text-zinc-700">{helper.fullName}</td>
                <td className="px-4 py-2 text-zinc-700">{helper.phone ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{helper.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(helper)}
                      disabled={editingId === helper.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {helper.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(helper)}
                      disabled={editingId === helper.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No helpers yet.</p>}
      </div>
    </div>
  );
}
