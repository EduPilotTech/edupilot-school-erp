"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyConcessionAction, removeConcessionAction } from "@/app/fees/concessions/actions";
import type { FeeConcessionDTO } from "@/modules/fees/application/dto/fee-concession.dto";

interface Option {
  id: string;
  name: string;
}

interface ConcessionManagerProps {
  studentId: string;
  academicSessionId: string;
  concessions: FeeConcessionDTO[];
  categories: Option[];
  canManage: boolean;
}

const CONCESSION_TYPES = ["DISCOUNT", "SCHOLARSHIP", "CONCESSION", "WAIVER", "SIBLING", "STAFF_WARD", "OTHER"] as const;
const VALUE_TYPES = ["PERCENTAGE", "FIXED_AMOUNT"] as const;

function categoryName(categories: Option[], id: string | null): string {
  if (!id) return "All categories";
  return categories.find((category) => category.id === id)?.name ?? id;
}

// Unifies Discount, Scholarship, Concession, and Waiver into one form (Phase 8 Decision 2) — a
// full waiver is simply `valueType=PERCENTAGE, value=100`, not a separate flow. Only affects
// invoices generated after it's applied — existing invoices keep their own snapshotted discount.
export function ConcessionManager({
  studentId,
  academicSessionId,
  concessions,
  categories,
  canManage,
}: ConcessionManagerProps) {
  const router = useRouter();
  const [feeCategoryId, setFeeCategoryId] = useState("");
  const [type, setType] = useState<(typeof CONCESSION_TYPES)[number]>("DISCOUNT");
  const [valueType, setValueType] = useState<(typeof VALUE_TYPES)[number]>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await applyConcessionAction({
        studentId,
        academicSessionId,
        feeCategoryId: feeCategoryId || undefined,
        type,
        valueType,
        value: Number(value),
        reason: reason || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setValue("");
      setReason("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(concessionId: string) {
    setRemovingId(concessionId);
    setError(null);
    try {
      const result = await removeConcessionAction(concessionId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="concession-category" className="text-xs font-medium text-zinc-500">
              Fee Category
            </label>
            <select
              id="concession-category"
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
            <label htmlFor="concession-type" className="text-xs font-medium text-zinc-500">
              Type
            </label>
            <select
              id="concession-type"
              value={type}
              onChange={(e) => setType(e.target.value as (typeof CONCESSION_TYPES)[number])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {CONCESSION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="concession-value-type" className="text-xs font-medium text-zinc-500">
              Value Type
            </label>
            <select
              id="concession-value-type"
              value={valueType}
              onChange={(e) => setValueType(e.target.value as (typeof VALUE_TYPES)[number])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {VALUE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="concession-value" className="text-xs font-medium text-zinc-500">
              Value
            </label>
            <input
              id="concession-value"
              type="number"
              min={0}
              max={valueType === "PERCENTAGE" ? 100 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="concession-reason" className="text-xs font-medium text-zinc-500">
              Reason (optional)
            </label>
            <input
              id="concession-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleApply}
            disabled={isSubmitting || !value}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Applying…" : "Apply Concession"}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Category</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Value</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reason</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {concessions.map((concession) => (
              <tr key={concession.id}>
                <td className="px-4 py-2 text-zinc-900">{categoryName(categories, concession.feeCategoryId)}</td>
                <td className="px-4 py-2 text-zinc-700">{concession.type}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {concession.valueType === "PERCENTAGE" ? `${concession.value}%` : `₹${concession.value}`}
                </td>
                <td className="px-4 py-2 text-zinc-700">{concession.reason ?? "—"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(concession.id)}
                      disabled={removingId === concession.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {concessions.length === 0 && <p className="p-4 text-sm text-zinc-500">No concessions applied yet.</p>}
      </div>
    </div>
  );
}
