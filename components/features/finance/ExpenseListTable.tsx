"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteExpenseAction } from "@/app/finance/actions";
import type { ExpenseDTO } from "@/modules/finance/application/dto/expense.dto";

export interface ExpenseRowDisplay extends ExpenseDTO {
  categoryName: string;
  accountName: string;
}

interface ExpenseListTableProps {
  items: ExpenseRowDisplay[];
  canManage: boolean;
}

// The symmetric counterpart of IncomeListTable.
export function ExpenseListTable({ items, canManage }: ExpenseListTableProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(expense: ExpenseRowDisplay) {
    if (!window.confirm("Delete this expense entry? This will also reverse its amount back onto the finance account balance.")) return;
    setBusyId(expense.id);
    setError(null);
    try {
      const result = await deleteExpenseAction(expense.id);
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
    <div className="flex flex-col gap-3">
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Category</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Account</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Vendor</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Payment Mode</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reference No</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((expense) => (
              <tr key={expense.id}>
                <td className="px-4 py-2 text-zinc-700">{expense.date}</td>
                <td className="px-4 py-2 text-zinc-900">{expense.categoryName}</td>
                <td className="px-4 py-2 text-zinc-700">{expense.accountName}</td>
                <td className="px-4 py-2 text-right font-medium text-zinc-900">₹{expense.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{expense.vendor ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{expense.paymentMode.replace("_", " ")}</td>
                <td className="px-4 py-2 text-zinc-700">{expense.referenceNo ?? "—"}</td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/finance/expense/${expense.id}/edit`}
                      className="mr-3 text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense)}
                      disabled={busyId === expense.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No expense entries found.</p>}
      </div>
    </div>
  );
}
