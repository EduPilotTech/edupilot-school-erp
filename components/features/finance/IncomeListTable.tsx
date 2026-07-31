"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteIncomeAction } from "@/app/finance/actions";
import type { IncomeDTO } from "@/modules/finance/application/dto/income.dto";

export interface IncomeRowDisplay extends IncomeDTO {
  categoryName: string;
  accountName: string;
}

interface IncomeListTableProps {
  items: IncomeRowDisplay[];
  canManage: boolean;
}

// List table for /finance/income — Edit links to the dedicated edit page, Delete calls
// deleteIncomeAction directly with a confirm() guard, matching
// components/features/payroll/EmployeeLoanManager.tsx's exact row-action precedent.
export function IncomeListTable({ items, canManage }: IncomeListTableProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(income: IncomeRowDisplay) {
    if (!window.confirm("Delete this income entry? This will also reverse its amount from the finance account balance.")) return;
    setBusyId(income.id);
    setError(null);
    try {
      const result = await deleteIncomeAction(income.id);
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reference No</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Description</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((income) => (
              <tr key={income.id}>
                <td className="px-4 py-2 text-zinc-700">{income.date}</td>
                <td className="px-4 py-2 text-zinc-900">{income.categoryName}</td>
                <td className="px-4 py-2 text-zinc-700">{income.accountName}</td>
                <td className="px-4 py-2 text-right font-medium text-zinc-900">₹{income.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{income.referenceNo ?? "—"}</td>
                <td className="max-w-[240px] truncate px-4 py-2 text-zinc-700" title={income.description ?? undefined}>
                  {income.description ?? "—"}
                </td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/finance/income/${income.id}/edit`}
                      className="mr-3 text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(income)}
                      disabled={busyId === income.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No income entries found.</p>}
      </div>
    </div>
  );
}
