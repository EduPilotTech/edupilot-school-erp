"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFineRuleAction, updateFineRuleAction } from "@/app/fees/setup/actions";
import type { FineRuleDTO } from "@/modules/fees/application/dto/fine-rule.dto";

interface Option {
  id: string;
  name: string;
}

interface FineRuleManagerProps {
  academicSessionId: string;
  rules: FineRuleDTO[];
  categories: Option[];
  canManage: boolean;
}

const FINE_TYPES = ["FLAT", "PERCENTAGE", "PER_DAY"] as const;

function categoryName(categories: Option[], id: string | null): string {
  if (!id) return "All categories";
  return categories.find((category) => category.id === id)?.name ?? id;
}

// Fine rules are computed lazily (Phase 8 Decision 4) — this manager only edits the policy, never
// a stored fine amount. A rule with no `feeCategoryId` is the session's catch-all, overridden by
// any category-specific rule (see compute-fine.helpers.ts's resolveFineRule).
export function FineRuleManager({ academicSessionId, rules, categories, canManage }: FineRuleManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [feeCategoryId, setFeeCategoryId] = useState("");
  const [gracePeriodDays, setGracePeriodDays] = useState("5");
  const [fineType, setFineType] = useState<(typeof FINE_TYPES)[number]>("FLAT");
  const [fineValue, setFineValue] = useState("");
  const [maxFineAmount, setMaxFineAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createFineRuleAction({
        academicSessionId,
        feeCategoryId: feeCategoryId || undefined,
        name,
        gracePeriodDays: Number(gracePeriodDays),
        fineType,
        fineValue: Number(fineValue),
        maxFineAmount: maxFineAmount ? Number(maxFineAmount) : undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setFineValue("");
      setMaxFineAmount("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(rule: FineRuleDTO) {
    setEditingId(rule.id);
    setError(null);
    try {
      const result = await updateFineRuleAction(rule.id, { isActive: !rule.isActive });
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
            <label htmlFor="finerule-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="finerule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Late Tuition Fine"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="finerule-category" className="text-xs font-medium text-zinc-500">
              Fee Category
            </label>
            <select
              id="finerule-category"
              value={feeCategoryId}
              onChange={(e) => setFeeCategoryId(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="finerule-grace" className="text-xs font-medium text-zinc-500">
              Grace Days
            </label>
            <input
              id="finerule-grace"
              type="number"
              min={0}
              value={gracePeriodDays}
              onChange={(e) => setGracePeriodDays(e.target.value)}
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="finerule-type" className="text-xs font-medium text-zinc-500">
              Fine Type
            </label>
            <select
              id="finerule-type"
              value={fineType}
              onChange={(e) => setFineType(e.target.value as (typeof FINE_TYPES)[number])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {FINE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="finerule-value" className="text-xs font-medium text-zinc-500">
              Value
            </label>
            <input
              id="finerule-value"
              type="number"
              min={0}
              value={fineValue}
              onChange={(e) => setFineValue(e.target.value)}
              className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="finerule-max" className="text-xs font-medium text-zinc-500">
              Max Fine (optional)
            </label>
            <input
              id="finerule-max"
              type="number"
              min={0}
              value={maxFineAmount}
              onChange={(e) => setMaxFineAmount(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name || !fineValue}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Fine Rule"}
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Category</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Grace Days</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Fine</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-2 text-zinc-900">{rule.name}</td>
                <td className="px-4 py-2 text-zinc-700">{categoryName(categories, rule.feeCategoryId)}</td>
                <td className="px-4 py-2 text-zinc-700">{rule.gracePeriodDays}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {rule.fineType === "PERCENTAGE" ? `${rule.fineValue}%` : `₹${rule.fineValue}`}
                  {rule.fineType === "PER_DAY" ? " / day" : ""}
                  {rule.maxFineAmount ? ` (max ₹${rule.maxFineAmount})` : ""}
                </td>
                <td className="px-4 py-2 text-zinc-700">{rule.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(rule)}
                      disabled={editingId === rule.id}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {rule.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rules.length === 0 && <p className="p-4 text-sm text-zinc-500">No fine rules configured yet.</p>}
      </div>
    </div>
  );
}
