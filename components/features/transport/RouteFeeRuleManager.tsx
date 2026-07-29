"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRouteFeeRuleAction, updateRouteFeeRuleAction, deleteRouteFeeRuleAction } from "@/app/transport/actions";
import type { RouteFeeRuleDTO } from "@/modules/transport/application/dto/route-fee-rule.dto";
import type { RouteDTO } from "@/modules/transport/application/dto/route.dto";
import type { FeeCategoryDTO } from "@/modules/fees/application/dto/fee-category.dto";

interface RouteFeeRuleManagerProps {
  academicSessionId: string;
  items: RouteFeeRuleDTO[];
  routes: RouteDTO[];
  feeCategories: FeeCategoryDTO[];
  defaultRouteId?: string;
  canManage: boolean;
}

const FREQUENCIES = ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL", "ONE_TIME", "INSTALLMENT"];

// RouteFeeRule is the transport analogue of FeeStructureItem — amount keyed by Route instead of
// Class (Phase 10 Decision 1). Only MONTHLY rules are picked up by the invoice generator this
// phase (see the Billing panel on this page).
export function RouteFeeRuleManager({
  academicSessionId,
  items,
  routes,
  feeCategories,
  defaultRouteId,
  canManage,
}: RouteFeeRuleManagerProps) {
  const router = useRouter();
  const [routeId, setRouteId] = useState(defaultRouteId ?? routes[0]?.id ?? "");
  const [feeCategoryId, setFeeCategoryId] = useState(feeCategories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function routeName(id: string) {
    return routes.find((route) => route.id === id)?.name ?? id;
  }
  function categoryName(id: string) {
    return feeCategories.find((category) => category.id === id)?.name ?? id;
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createRouteFeeRuleAction({
        routeId,
        academicSessionId,
        feeCategoryId,
        amount: Number(amount),
        frequency,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setAmount("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(rule: RouteFeeRuleDTO) {
    setEditingId(rule.id);
    setError(null);
    try {
      const result = await updateRouteFeeRuleAction(rule.id, { isActive: !rule.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setEditingId(null);
    }
  }

  async function handleDelete(rule: RouteFeeRuleDTO) {
    setEditingId(rule.id);
    setError(null);
    try {
      const result = await deleteRouteFeeRuleAction(rule.id);
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
            <label htmlFor="rule-route" className="text-xs font-medium text-zinc-500">
              Route
            </label>
            <select
              id="rule-route"
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="rule-category" className="text-xs font-medium text-zinc-500">
              Fee Category
            </label>
            <select
              id="rule-category"
              value={feeCategoryId}
              onChange={(e) => setFeeCategoryId(e.target.value)}
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {feeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="rule-amount" className="text-xs font-medium text-zinc-500">
              Amount
            </label>
            <input
              id="rule-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="rule-frequency" className="text-xs font-medium text-zinc-500">
              Frequency
            </label>
            <select
              id="rule-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !routeId || !feeCategoryId || !amount}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Add Fee Rule"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Route</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Fee Category</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Frequency</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{routeName(rule.routeId)}</td>
                <td className="px-4 py-2 text-zinc-700">{categoryName(rule.feeCategoryId)}</td>
                <td className="px-4 py-2 text-zinc-700">{rule.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{rule.frequency.replaceAll("_", " ")}</td>
                <td className="px-4 py-2 text-zinc-700">{rule.isActive ? "Active" : "Inactive"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(rule)}
                      disabled={editingId === rule.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {rule.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rule)}
                      disabled={editingId === rule.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No fee rules yet.</p>}
      </div>
    </div>
  );
}
