"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFeeStructureAction,
  addFeeStructureItemAction,
  updateFeeStructureItemAction,
} from "@/app/fees/setup/actions";
import type { FeeStructureDTO, FeeStructureItemDTO } from "@/modules/fees/application/dto/fee-structure.dto";

interface Option {
  id: string;
  name: string;
}

interface FeeStructureManagerProps {
  academicSessionId: string;
  structures: FeeStructureDTO[];
  selectedStructureId: string;
  items: FeeStructureItemDTO[];
  classes: Option[];
  categories: Option[];
  canManage: boolean;
}

const FREQUENCIES = ["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL", "INSTALLMENT"] as const;

function optionName(options: Option[], id: string): string {
  return options.find((option) => option.id === id)?.name ?? id;
}

// A FeeStructure is a named, session-scoped policy container; its items give the class-wise
// amount per fee category (`classId` always set, never a nullable "all classes" wildcard — see
// fee-structure-item.repository.ts's own comment). Switching structures navigates via
// `?structureId=`, mirroring the session-switch `?academicSessionId=` pattern already used on
// this page.
export function FeeStructureManager({
  academicSessionId,
  structures,
  selectedStructureId,
  items,
  classes,
  categories,
  canManage,
}: FeeStructureManagerProps) {
  const router = useRouter();
  const [newStructureName, setNewStructureName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [feeCategoryId, setFeeCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>("MONTHLY");
  const [dueDayOfMonth, setDueDayOfMonth] = useState("10");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function switchStructure(nextStructureId: string) {
    router.push(`/fees/structures?academicSessionId=${academicSessionId}&structureId=${nextStructureId}`);
  }

  async function handleCreateStructure() {
    setIsCreating(true);
    setError(null);
    try {
      const result = await createFeeStructureAction({ academicSessionId, name: newStructureName });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setNewStructureName("");
      switchStructure(result.data.id);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAddItem() {
    setIsAddingItem(true);
    setError(null);
    try {
      const result = await addFeeStructureItemAction({
        feeStructureId: selectedStructureId,
        classId,
        feeCategoryId,
        amount: Number(amount),
        frequency,
        dueDayOfMonth: frequency === "MONTHLY" ? Number(dueDayOfMonth) : undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setAmount("");
      router.refresh();
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleToggleActive(item: FeeStructureItemDTO) {
    setEditingId(item.id);
    setError(null);
    try {
      const result = await updateFeeStructureItemAction(item.id, { isActive: !item.isActive });
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
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="structure-select" className="text-xs font-medium text-zinc-500">
              Fee Structure
            </label>
            <select
              id="structure-select"
              value={selectedStructureId}
              onChange={(e) => switchStructure(e.target.value)}
              className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {structures.map((structure) => (
                <option key={structure.id} value={structure.id}>
                  {structure.name}
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="new-structure-name" className="text-xs font-medium text-zinc-500">
                  New Structure Name
                </label>
                <input
                  id="new-structure-name"
                  value={newStructureName}
                  onChange={(e) => setNewStructureName(e.target.value)}
                  placeholder="2026-27 Standard"
                  className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateStructure}
                disabled={isCreating || !newStructureName}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creating…" : "Create Structure"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {selectedStructureId && (
        <div className="flex flex-col gap-4">
          {canManage && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="item-class" className="text-xs font-medium text-zinc-500">
                  Class
                </label>
                <select
                  id="item-class"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  {classes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="item-category" className="text-xs font-medium text-zinc-500">
                  Fee Category
                </label>
                <select
                  id="item-category"
                  value={feeCategoryId}
                  onChange={(e) => setFeeCategoryId(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  {categories.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="item-amount" className="text-xs font-medium text-zinc-500">
                  Amount
                </label>
                <input
                  id="item-amount"
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="item-frequency" className="text-xs font-medium text-zinc-500">
                  Frequency
                </label>
                <select
                  id="item-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as (typeof FREQUENCIES)[number])}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  {FREQUENCIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              {frequency === "MONTHLY" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="item-due-day" className="text-xs font-medium text-zinc-500">
                    Due Day of Month
                  </label>
                  <input
                    id="item-due-day"
                    type="number"
                    min={1}
                    max={28}
                    value={dueDayOfMonth}
                    onChange={(e) => setDueDayOfMonth(e.target.value)}
                    className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isAddingItem || !classId || !feeCategoryId || !amount}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingItem ? "Adding…" : "Add Item"}
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Class</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Fee Category</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Frequency</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
                  {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-zinc-900">{optionName(classes, item.classId)}</td>
                    <td className="px-4 py-2 text-zinc-700">{optionName(categories, item.feeCategoryId)}</td>
                    <td className="px-4 py-2 text-zinc-700">₹{item.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-zinc-700">{item.frequency}</td>
                    <td className="px-4 py-2 text-zinc-700">{item.isActive ? "Active" : "Inactive"}</td>
                    {canManage && (
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          disabled={editingId === item.id}
                          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No fee items configured yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
