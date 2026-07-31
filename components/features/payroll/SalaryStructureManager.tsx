"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createSalaryStructureAction,
  updateSalaryStructureAction,
  deleteSalaryStructureAction,
} from "@/app/payroll/actions";
import type { SalaryStructureDTO } from "@/modules/payroll/application/dto/salary-structure.dto";

interface SalaryStructureManagerProps {
  schoolId: string;
  items: SalaryStructureDTO[];
  canManage: boolean;
}

// Mirrors components/features/hr/LeaveTypeManager.tsx's create-form + table shape exactly. Each
// structure's own components (earnings/deductions) are managed on its detail page, not here.
export function SalaryStructureManager({ schoolId, items, canManage }: SalaryStructureManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createSalaryStructureAction({ schoolId, name });
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

  async function handleToggleActive(structure: SalaryStructureDTO) {
    setBusyId(structure.id);
    setError(null);
    try {
      const result = await updateSalaryStructureAction(structure.id, { isActive: !structure.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(structure: SalaryStructureDTO) {
    if (!window.confirm(`Delete the salary structure "${structure.name}"? This cannot be undone.`)) return;
    setBusyId(structure.id);
    setError(null);
    try {
      const result = await deleteSalaryStructureAction(structure.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="structure-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="structure-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Standard Teaching Staff"
              className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Salary Structure"}
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
            {items.map((structure) => (
              <tr key={structure.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  <Link href={`/payroll/salary-structures/${structure.id}`} className="text-blue-600 hover:underline">
                    {structure.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-700">{structure.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(structure)}
                      disabled={busyId === structure.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {structure.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(structure)}
                      disabled={busyId === structure.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No salary structures yet.</p>}
      </div>
    </div>
  );
}
