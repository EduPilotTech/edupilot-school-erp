"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInstallmentPlanAction } from "@/app/fees/setup/actions";
import type { InstallmentPlanDTO } from "@/modules/fees/application/dto/installment-plan.dto";

interface InstallmentPlanManagerProps {
  academicSessionId: string;
  plans: InstallmentPlanDTO[];
  canManage: boolean;
}

interface ItemDraft {
  installmentNumber: number;
  percentageOfTotal: string;
  dueDayOffset: string;
}

function defaultItems(): ItemDraft[] {
  return [
    { installmentNumber: 1, percentageOfTotal: "50", dueDayOffset: "0" },
    { installmentNumber: 2, percentageOfTotal: "50", dueDayOffset: "180" },
  ];
}

// Installment percentages must sum to 100 (validated server-side by
// installment-plan-validation.helpers.ts) — `dueDayOffset` is days from the AcademicSession's own
// startDate, computed at generation time (see billing-period.helpers.ts), not hand-entered dates.
export function InstallmentPlanManager({ academicSessionId, plans, canManage }: InstallmentPlanManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [items, setItems] = useState<ItemDraft[]>(defaultItems());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems([...items, { installmentNumber: items.length + 1, percentageOfTotal: "", dueDayOffset: "" }]);
  }

  function removeItem(index: number) {
    setItems(
      items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, installmentNumber: i + 1 }))
    );
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createInstallmentPlanAction({
        academicSessionId,
        name,
        items: items.map((item) => ({
          installmentNumber: item.installmentNumber,
          percentageOfTotal: Number(item.percentageOfTotal),
          dueDayOffset: Number(item.dueDayOffset),
        })),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setItems(defaultItems());
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {canManage && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-semibold text-zinc-900">New Installment Plan</h2>
          <div className="mt-3 flex flex-col gap-1">
            <label htmlFor="plan-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Half-Yearly"
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {items.map((item, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-sm text-zinc-500">#{item.installmentNumber}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={item.percentageOfTotal}
                  onChange={(e) => updateItem(index, { percentageOfTotal: e.target.value })}
                  placeholder="Percentage"
                  className="w-28 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                />
                <span className="text-sm text-zinc-500">% due</span>
                <input
                  type="number"
                  min={0}
                  value={item.dueDayOffset}
                  onChange={(e) => updateItem(index, { dueDayOffset: e.target.value })}
                  placeholder="Days from session start"
                  className="w-48 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                />
                <span className="text-sm text-zinc-500">days after session start</span>
                <button type="button" onClick={() => removeItem(index)} className="text-sm text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              Add Installment
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting || !name}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save Installment Plan"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Installments</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="px-4 py-2 text-zinc-900">{plan.name}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {plan.items.map((item) => `#${item.installmentNumber} (${item.percentageOfTotal}%)`).join(", ")}
                </td>
                <td className="px-4 py-2 text-zinc-700">{plan.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {plans.length === 0 && <p className="p-4 text-sm text-zinc-500">No installment plans yet.</p>}
      </div>
    </div>
  );
}
