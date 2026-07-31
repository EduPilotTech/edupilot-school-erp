"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFinanceAccountAction, updateFinanceAccountAction, deleteFinanceAccountAction } from "@/app/finance/actions";
import type { FinanceAccountDTO } from "@/modules/finance/application/dto/finance-account.dto";

interface FinanceAccountManagerProps {
  items: FinanceAccountDTO[];
  canManage: boolean;
}

const ACCOUNT_TYPES = ["CASH", "BANK"] as const;

interface EditState {
  id: string;
  name: string;
  accountType: (typeof ACCOUNT_TYPES)[number];
  isDefault: boolean;
}

// Mirrors components/features/hr/DepartmentManager.tsx's create-form + table shape, extended with
// a per-row Edit (name/type/default — openingBalance and currentBalance are immutable-after-create
// and system-maintained respectively, per createFinanceAccountSchema/updateFinanceAccountSchema's
// own doc comments, so they are never editable here) alongside the usual Deactivate/Delete.
export function FinanceAccountManager({ items, canManage }: FinanceAccountManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<(typeof ACCOUNT_TYPES)[number]>("CASH");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createFinanceAccountAction({
        name,
        accountType,
        openingBalance: Number(openingBalance),
        isDefault,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setName("");
      setAccountType("CASH");
      setOpeningBalance("0");
      setIsDefault(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(account: FinanceAccountDTO) {
    setError(null);
    setEdit({ id: account.id, name: account.name, accountType: account.accountType, isDefault: account.isDefault });
  }

  function cancelEdit() {
    setEdit(null);
  }

  async function handleSaveEdit() {
    if (!edit) return;
    setBusyId(edit.id);
    setError(null);
    try {
      const result = await updateFinanceAccountAction(edit.id, {
        name: edit.name,
        accountType: edit.accountType,
        isDefault: edit.isDefault,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setEdit(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(account: FinanceAccountDTO) {
    setBusyId(account.id);
    setError(null);
    try {
      const result = await updateFinanceAccountAction(account.id, { isActive: !account.isActive });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(account: FinanceAccountDTO) {
    if (!window.confirm(`Delete finance account "${account.name}"?`)) return;
    setBusyId(account.id);
    setError(null);
    try {
      const result = await deleteFinanceAccountAction(account.id);
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
            <label htmlFor="finance-account-name" className="text-xs font-medium text-zinc-500">
              Name
            </label>
            <input
              id="finance-account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Petty Cash"
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="finance-account-type" className="text-xs font-medium text-zinc-500">
              Type
            </label>
            <select
              id="finance-account-type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as (typeof ACCOUNT_TYPES)[number])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="finance-account-opening-balance" className="text-xs font-medium text-zinc-500">
              Opening Balance (₹)
            </label>
            <input
              id="finance-account-opening-balance"
              type="number"
              min={0}
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-36 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="finance-account-default" className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <input
                id="finance-account-default"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
              />
              Default Account
            </label>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Adding…" : "Add Finance Account"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Opening Balance</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Current Balance</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Default</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((account) => {
              const isEditingRow = edit?.id === account.id;
              return (
                <tr key={account.id}>
                  {isEditingRow ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={edit.name}
                          onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                          className="w-40 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={edit.accountType}
                          onChange={(e) => setEdit({ ...edit, accountType: e.target.value as (typeof ACCOUNT_TYPES)[number] })}
                          className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                        >
                          {ACCOUNT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right text-zinc-500">₹{account.openingBalance.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-zinc-500">₹{account.currentBalance.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <label className="flex items-center gap-2 text-xs text-zinc-500">
                          <input
                            type="checkbox"
                            checked={edit.isDefault}
                            onChange={(e) => setEdit({ ...edit, isDefault: e.target.checked })}
                            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/40"
                          />
                          Default
                        </label>
                      </td>
                      <td className="px-4 py-2 text-zinc-700">{account.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={busyId === account.id || !edit.name}
                          className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit} className="text-sm text-zinc-600 hover:underline">
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-medium text-zinc-900">{account.name}</td>
                      <td className="px-4 py-2 text-zinc-700">{account.accountType}</td>
                      <td className="px-4 py-2 text-right text-zinc-700">₹{account.openingBalance.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium text-zinc-900">₹{account.currentBalance.toFixed(2)}</td>
                      <td className="px-4 py-2 text-zinc-700">{account.isDefault ? "Yes" : "—"}</td>
                      <td className="px-4 py-2 text-zinc-700">{account.isActive ? "Active" : "Inactive"}</td>
                      {canManage && (
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => startEdit(account)}
                            disabled={busyId === account.id}
                            className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(account)}
                            disabled={busyId === account.id}
                            className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                          >
                            {account.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            disabled={busyId === account.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No finance accounts yet.</p>}
      </div>
    </div>
  );
}
