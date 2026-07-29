"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFeeCategoryAction,
  updateFeeCategoryAction,
  deleteFeeCategoryAction,
} from "@/app/fees/setup/actions";
import type { FeeCategoryDTO } from "@/modules/fees/application/dto/fee-category.dto";

interface FeeCategoryManagerProps {
  items: FeeCategoryDTO[];
  canManage: boolean;
}

// Fee Category is master data (name, code, isRecurring) — same one-inline-form-plus-table shape
// as ExamTypeManager/SubjectManager. `isRecurring` distinguishes monthly-billed categories from
// one-time fees (admission, ID card) without a separate model.
export function FeeCategoryManager({ items, canManage }: FeeCategoryManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createFeeCategoryAction({ name, code, isRecurring });
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

  async function handleToggleActive(category: FeeCategoryDTO) {
    setEditingId(category.id);
    setError(null);
    try {
      const result = await updateFeeCategoryAction(category.id, { isActive: !category.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(category: FeeCategoryDTO) {
    setEditingId(category.id);
    setError(null);
    try {
      const result = await deleteFeeCategoryAction(category.id);
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
            <label htmlFor="feecategory-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="feecategory-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tuition Fee"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="feecategory-code" className="text-xs font-medium text-zinc-500">
              Code
            </label>
            <input
              id="feecategory-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="TUITION"
              className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 pb-1.5 text-sm text-zinc-700">
            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
            Recurring (monthly)
          </label>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name || !code}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Fee Category"}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Frequency</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-2 text-zinc-900">{category.name}</td>
                <td className="px-4 py-2 text-zinc-700">{category.code}</td>
                <td className="px-4 py-2 text-zinc-700">{category.isRecurring ? "Monthly" : "One-time"}</td>
                <td className="px-4 py-2 text-zinc-700">{category.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(category)}
                      disabled={editingId === category.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {category.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      disabled={editingId === category.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No fee categories yet.</p>}
      </div>
    </div>
  );
}
