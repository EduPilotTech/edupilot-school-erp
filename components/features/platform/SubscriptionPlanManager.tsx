"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createSubscriptionPlanDefinitionAction,
  updateSubscriptionPlanDefinitionAction,
  deactivateSubscriptionPlanDefinitionAction,
} from "@/app/billing/platform-actions";
import type { SubscriptionPlanDefinitionDTO } from "@/modules/billing/application/dto/subscription-plan-definition.dto";

interface SubscriptionPlanManagerProps {
  items: SubscriptionPlanDefinitionDTO[];
}

const PLAN_CODE_OPTIONS = ["FREE", "BASIC", "PRO", "ENTERPRISE"] as const;

interface EditFormState {
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  currency: string;
  trialDays: string;
}

function toEditFormState(plan: SubscriptionPlanDefinitionDTO): EditFormState {
  return {
    name: plan.name,
    description: plan.description ?? "",
    monthlyPrice: String(plan.monthlyPrice),
    annualPrice: String(plan.annualPrice),
    currency: plan.currency,
    trialDays: String(plan.trialDays),
  };
}

// Master-data CRUD manager for the public plan catalog — mirrors DepartmentManager.tsx's inline
// create-form + table shape, extended with a per-row inline edit form (the plan definition has
// more fields than a department) and a "Deactivate" action in place of delete (plan definitions
// are soft-deleted only; see subscription-plan-definition.service.ts's own "never physically
// removed once a Subscription has snapshotted it" comment).
export function SubscriptionPlanManager({ items }: SubscriptionPlanManagerProps) {
  const router = useRouter();

  const [planCode, setPlanCode] = useState<(typeof PLAN_CODE_OPTIONS)[number]>("FREE");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [annualPrice, setAnnualPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [trialDays, setTrialDays] = useState("0");
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    try {
      const result = await createSubscriptionPlanDefinitionAction({
        planCode,
        name,
        description: description.trim() === "" ? undefined : description,
        monthlyPrice: Number(monthlyPrice),
        annualPrice: Number(annualPrice),
        currency,
        trialDays: Number(trialDays),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setDescription("");
      setMonthlyPrice("");
      setAnnualPrice("");
      setCurrency("INR");
      setTrialDays("0");
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  function beginEdit(plan: SubscriptionPlanDefinitionDTO) {
    setError(null);
    setEditingId(plan.id);
    setEditForm(toEditFormState(plan));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function handleSaveEdit(planId: string) {
    if (!editForm) return;
    setBusyId(planId);
    setError(null);
    try {
      const result = await updateSubscriptionPlanDefinitionAction(planId, {
        name: editForm.name,
        description: editForm.description.trim() === "" ? null : editForm.description,
        monthlyPrice: Number(editForm.monthlyPrice),
        annualPrice: Number(editForm.annualPrice),
        currency: editForm.currency,
        trialDays: Number(editForm.trialDays),
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setEditingId(null);
      setEditForm(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeactivate(planId: string) {
    if (!window.confirm("Deactivate this plan? It will no longer be assignable to any school.")) return;
    setBusyId(planId);
    setError(null);
    try {
      const result = await deactivateSubscriptionPlanDefinitionAction(planId);
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
          <label htmlFor="plan-code" className="text-xs font-medium text-zinc-500">
            Plan Code
          </label>
          <select
            id="plan-code"
            value={planCode}
            onChange={(e) => setPlanCode(e.target.value as (typeof PLAN_CODE_OPTIONS)[number])}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {PLAN_CODE_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plan-name" className="text-xs font-medium text-zinc-500">
            Name
          </label>
          <input
            id="plan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pro"
            className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plan-description" className="text-xs font-medium text-zinc-500">
            Description
          </label>
          <input
            id="plan-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plan-monthly-price" className="text-xs font-medium text-zinc-500">
            Monthly Price
          </label>
          <input
            id="plan-monthly-price"
            type="number"
            min="0"
            step="0.01"
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(e.target.value)}
            className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plan-annual-price" className="text-xs font-medium text-zinc-500">
            Annual Price
          </label>
          <input
            id="plan-annual-price"
            type="number"
            min="0"
            step="0.01"
            value={annualPrice}
            onChange={(e) => setAnnualPrice(e.target.value)}
            className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plan-currency" className="text-xs font-medium text-zinc-500">
            Currency
          </label>
          <input
            id="plan-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            className="w-16 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="plan-trial-days" className="text-xs font-medium text-zinc-500">
            Trial Days
          </label>
          <input
            id="plan-trial-days"
            type="number"
            min="0"
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
            className="w-20 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !name || !monthlyPrice || !annualPrice || !currency}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? "Creating…" : "Add Plan"}
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Plan Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Monthly</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Annual</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Trial Days</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((plan) => (
              <Fragment key={plan.id}>
                <tr>
                  <td className="px-4 py-2 font-medium text-zinc-900">{plan.planCode}</td>
                  <td className="px-4 py-2 text-zinc-700">
                    <Link href={`/platform/plans/${plan.id}`} className="text-blue-600 hover:underline">
                      {plan.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-700">
                    {plan.currency} {plan.monthlyPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-zinc-700">
                    {plan.currency} {plan.annualPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-zinc-700">{plan.trialDays}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        plan.isActive ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {plan.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => (editingId === plan.id ? cancelEdit() : beginEdit(plan))}
                      className="mr-3 text-sm text-blue-600 hover:underline"
                    >
                      {editingId === plan.id ? "Cancel" : "Edit"}
                    </button>
                    {plan.isActive && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(plan.id)}
                        disabled={busyId === plan.id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
                {editingId === plan.id && editForm && (
                  <tr>
                    <td colSpan={7} className="bg-zinc-50 px-4 py-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-zinc-500">Name</label>
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-zinc-500">Description</label>
                          <input
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-zinc-500">Monthly Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.monthlyPrice}
                            onChange={(e) => setEditForm({ ...editForm, monthlyPrice: e.target.value })}
                            className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-zinc-500">Annual Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.annualPrice}
                            onChange={(e) => setEditForm({ ...editForm, annualPrice: e.target.value })}
                            className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-zinc-500">Currency</label>
                          <input
                            value={editForm.currency}
                            onChange={(e) => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })}
                            maxLength={3}
                            className="w-16 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-zinc-500">Trial Days</label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.trialDays}
                            onChange={(e) => setEditForm({ ...editForm, trialDays: e.target.value })}
                            className="w-20 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(plan.id)}
                          disabled={busyId === plan.id}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyId === plan.id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No subscription plans yet.</p>}
      </div>
    </div>
  );
}
