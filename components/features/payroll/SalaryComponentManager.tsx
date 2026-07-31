"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addSalaryComponentAction,
  updateSalaryComponentAction,
  deleteSalaryComponentAction,
} from "@/app/payroll/actions";
import type { SalaryComponentDTO } from "@/modules/payroll/application/dto/salary-structure.dto";

interface SalaryComponentManagerProps {
  salaryStructureId: string;
  items: SalaryComponentDTO[];
  canManage: boolean;
}

const COMPONENT_TYPES = ["EARNING", "DEDUCTION"] as const;
const CALCULATION_TYPES = ["FLAT", "PERCENTAGE_OF_BASIC"] as const;

interface EditState {
  name: string;
  componentType: (typeof COMPONENT_TYPES)[number];
  calculationType: (typeof CALCULATION_TYPES)[number];
  value: string;
  isStatutory: boolean;
}

function calculationLabel(type: (typeof CALCULATION_TYPES)[number]): string {
  return type === "PERCENTAGE_OF_BASIC" ? "% of Basic" : "Flat";
}

function valueDisplay(component: SalaryComponentDTO): string {
  return component.calculationType === "PERCENTAGE_OF_BASIC"
    ? `${component.value}% of Basic`
    : `₹${component.value.toFixed(2)}`;
}

// Inline "Add Component" form + editable table, per the Phase 13 UI spec §2 — Edit turns a row
// into inputs (name/type/calculation/value/statutory only; `code` is immutable post-creation,
// matching updateSalaryComponentSchema, which has no `code` field), Deactivate flips isActive,
// Delete soft-deletes via deleteSalaryComponentAction.
export function SalaryComponentManager({ salaryStructureId, items, canManage }: SalaryComponentManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [componentType, setComponentType] = useState<(typeof COMPONENT_TYPES)[number]>("EARNING");
  const [calculationType, setCalculationType] = useState<(typeof CALCULATION_TYPES)[number]>("FLAT");
  const [value, setValue] = useState("");
  const [isStatutory, setIsStatutory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await addSalaryComponentAction({
        salaryStructureId,
        name,
        code: code.toUpperCase(),
        componentType,
        calculationType,
        value: Number(value),
        isStatutory,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setCode("");
      setValue("");
      setIsStatutory(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(component: SalaryComponentDTO) {
    setEditingId(component.id);
    setEditState({
      name: component.name,
      componentType: component.componentType,
      calculationType: component.calculationType,
      value: String(component.value),
      isStatutory: component.isStatutory,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
  }

  async function saveEdit(component: SalaryComponentDTO) {
    if (!editState) return;
    setBusyId(component.id);
    setError(null);
    try {
      const result = await updateSalaryComponentAction(component.id, {
        name: editState.name,
        componentType: editState.componentType,
        calculationType: editState.calculationType,
        value: Number(editState.value),
        isStatutory: editState.isStatutory,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      cancelEdit();
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(component: SalaryComponentDTO) {
    setBusyId(component.id);
    setError(null);
    try {
      const result = await updateSalaryComponentAction(component.id, { isActive: !component.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(component: SalaryComponentDTO) {
    if (!window.confirm(`Delete the component "${component.name}"? This cannot be undone.`)) return;
    setBusyId(component.id);
    setError(null);
    try {
      const result = await deleteSalaryComponentAction(component.id);
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
            <label htmlFor="component-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="component-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Basic Pay"
              className="w-44 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="component-code" className="text-xs font-medium text-zinc-500">
              Code
            </label>
            <input
              id="component-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BASIC"
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm uppercase"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="component-type" className="text-xs font-medium text-zinc-500">
              Type
            </label>
            <select
              id="component-type"
              value={componentType}
              onChange={(e) => setComponentType(e.target.value as (typeof COMPONENT_TYPES)[number])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {COMPONENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="component-calc" className="text-xs font-medium text-zinc-500">
              Calculation
            </label>
            <select
              id="component-calc"
              value={calculationType}
              onChange={(e) => setCalculationType(e.target.value as (typeof CALCULATION_TYPES)[number])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {CALCULATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {calculationLabel(type)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="component-value" className="text-xs font-medium text-zinc-500">
              {calculationType === "PERCENTAGE_OF_BASIC" ? "Value (%)" : "Value (₹)"}
            </label>
            <input
              id="component-value"
              type="number"
              min={0}
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="component-statutory" className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <input
                id="component-statutory"
                type="checkbox"
                checked={isStatutory}
                onChange={(e) => setIsStatutory(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
              />
              Statutory
            </label>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name || !code || !value}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Component"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Code</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Calculation</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Value</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Statutory</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((component) => {
              const isEditing = editingId === component.id && editState !== null;
              return (
                <tr key={component.id}>
                  {isEditing && editState ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editState.name}
                          onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                          className="w-36 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-zinc-500">{component.code}</td>
                      <td className="px-4 py-2">
                        <select
                          value={editState.componentType}
                          onChange={(e) =>
                            setEditState({ ...editState, componentType: e.target.value as (typeof COMPONENT_TYPES)[number] })
                          }
                          className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                        >
                          {COMPONENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editState.calculationType}
                          onChange={(e) =>
                            setEditState({ ...editState, calculationType: e.target.value as (typeof CALCULATION_TYPES)[number] })
                          }
                          className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                        >
                          {CALCULATION_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {calculationLabel(type)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editState.value}
                          onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                          className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={editState.isStatutory}
                          onChange={(e) => setEditState({ ...editState, isStatutory: e.target.checked })}
                          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                        />
                      </td>
                      <td className="px-4 py-2 text-zinc-700">{component.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => saveEdit(component)}
                          disabled={busyId === component.id || !editState.name || !editState.value}
                          className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={busyId === component.id}
                          className="text-sm text-zinc-500 hover:underline disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-medium text-zinc-900">{component.name}</td>
                      <td className="px-4 py-2 text-zinc-700">{component.code}</td>
                      <td className="px-4 py-2 text-zinc-700">{component.componentType}</td>
                      <td className="px-4 py-2 text-zinc-700">{calculationLabel(component.calculationType)}</td>
                      <td className="px-4 py-2 text-zinc-700">{valueDisplay(component)}</td>
                      <td className="px-4 py-2 text-zinc-700">{component.isStatutory ? "Yes" : "No"}</td>
                      <td className="px-4 py-2 text-zinc-700">{component.isActive ? "Active" : "Inactive"}</td>
                      {canManage && (
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => startEdit(component)}
                            disabled={busyId === component.id}
                            className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(component)}
                            disabled={busyId === component.id}
                            className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                          >
                            {component.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(component)}
                            disabled={busyId === component.id}
                            className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No components yet.</p>}
      </div>
    </div>
  );
}
