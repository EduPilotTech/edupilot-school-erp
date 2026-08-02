"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPlanFeatureEntitlementAction,
  updatePlanFeatureEntitlementAction,
  deletePlanFeatureEntitlementAction,
} from "@/app/billing/platform-actions";
import type { PlanFeatureEntitlementDTO } from "@/modules/billing/application/dto/plan-feature-entitlement.dto";

interface PlanFeatureEntitlementManagerProps {
  subscriptionPlanDefinitionId: string;
  items: PlanFeatureEntitlementDTO[];
}

type ValueType = "BOOLEAN" | "LIMIT";

// Add/edit/delete entitlement rows for one plan — mirrors DepartmentManager.tsx's inline
// create-form + table shape. The add form's booleanValue/limitValue input is conditionally shown
// based on the selected valueType, matching createPlanFeatureEntitlementSchema's own refine rules
// (a BOOLEAN entitlement requires booleanValue, a LIMIT entitlement requires limitValue).
export function PlanFeatureEntitlementManager({ subscriptionPlanDefinitionId, items }: PlanFeatureEntitlementManagerProps) {
  const router = useRouter();

  const [featureKey, setFeatureKey] = useState("");
  const [valueType, setValueType] = useState<ValueType>("BOOLEAN");
  const [booleanValue, setBooleanValue] = useState(false);
  const [limitValue, setLimitValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    try {
      const result = await createPlanFeatureEntitlementAction({
        subscriptionPlanDefinitionId,
        featureKey,
        valueType,
        booleanValue: valueType === "BOOLEAN" ? booleanValue : undefined,
        limitValue: valueType === "LIMIT" ? Number(limitValue) : undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setFeatureKey("");
      setBooleanValue(false);
      setLimitValue("");
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleBoolean(entitlement: PlanFeatureEntitlementDTO) {
    setBusyId(entitlement.id);
    setError(null);
    try {
      const result = await updatePlanFeatureEntitlementAction(entitlement.id, {
        booleanValue: !entitlement.booleanValue,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(entitlement: PlanFeatureEntitlementDTO) {
    if (!window.confirm(`Delete the "${entitlement.featureKey}" entitlement?`)) return;
    setBusyId(entitlement.id);
    setError(null);
    try {
      const result = await deletePlanFeatureEntitlementAction(entitlement.id);
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
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="entitlement-feature-key" className="text-xs font-medium text-zinc-500">
            Feature Key
          </label>
          <input
            id="entitlement-feature-key"
            value={featureKey}
            onChange={(e) => setFeatureKey(e.target.value)}
            placeholder="hostel_module"
            className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="entitlement-value-type" className="text-xs font-medium text-zinc-500">
            Value Type
          </label>
          <select
            id="entitlement-value-type"
            value={valueType}
            onChange={(e) => setValueType(e.target.value as ValueType)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="BOOLEAN">BOOLEAN</option>
            <option value="LIMIT">LIMIT</option>
          </select>
        </div>
        {valueType === "BOOLEAN" ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="entitlement-boolean-value" className="text-xs font-medium text-zinc-500">
              Enabled
            </label>
            <input
              id="entitlement-boolean-value"
              type="checkbox"
              checked={booleanValue}
              onChange={(e) => setBooleanValue(e.target.checked)}
              className="h-9 w-5"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="entitlement-limit-value" className="text-xs font-medium text-zinc-500">
              Limit
            </label>
            <input
              id="entitlement-limit-value"
              type="number"
              min="0"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              placeholder="500"
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !featureKey || (valueType === "LIMIT" && limitValue === "")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? "Adding…" : "Add Entitlement"}
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Feature Key</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Value Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Value</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((entitlement) => (
              <tr key={entitlement.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">{entitlement.featureKey}</td>
                <td className="px-4 py-2 text-zinc-700">{entitlement.valueType}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {entitlement.valueType === "BOOLEAN" ? (entitlement.booleanValue ? "Yes" : "No") : entitlement.limitValue}
                </td>
                <td className="px-4 py-2 text-right">
                  {entitlement.valueType === "BOOLEAN" && (
                    <button
                      type="button"
                      onClick={() => handleToggleBoolean(entitlement)}
                      disabled={busyId === entitlement.id}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {entitlement.booleanValue ? "Disable" : "Enable"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(entitlement)}
                    disabled={busyId === entitlement.id}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No feature entitlements yet.</p>}
      </div>
    </div>
  );
}
