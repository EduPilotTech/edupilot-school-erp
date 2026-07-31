"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPayrollRunAction } from "@/app/payroll/actions";
import type { PayrollRunDTO } from "@/modules/payroll/application/dto/payroll-run.dto";
import { StatusBadge } from "./StatusBadge";

interface PayrollRunListManagerProps {
  schoolId: string;
  items: PayrollRunDTO[];
}

export function PayrollRunListManager({ schoolId, items }: PayrollRunListManagerProps) {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createPayrollRunAction({ schoolId, billingPeriod });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.push(`/payroll/runs/${result.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="run-period" className="text-xs font-medium text-zinc-500">
            Billing Period
          </label>
          <input
            id="run-period"
            type="month"
            value={billingPeriod}
            onChange={(e) => setBillingPeriod(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isSubmitting || !billingPeriod}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Create New Run"}
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Billing Period</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Gross</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Deductions</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Net Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((run) => (
              <tr key={run.id}>
                <td className="px-4 py-2 font-medium text-zinc-900">
                  <Link href={`/payroll/runs/${run.id}`} className="text-blue-600 hover:underline">
                    {run.billingPeriod}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-2 text-zinc-700">₹{run.totalGross.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">₹{run.totalDeductions.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">₹{run.totalNetPay.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No payroll runs yet.</p>}
      </div>
    </div>
  );
}
