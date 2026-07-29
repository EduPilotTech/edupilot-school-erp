"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelInvoiceAction } from "@/app/fees/billing/actions";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

interface InvoiceListTableProps {
  invoices: FeeInvoiceDTO[];
  studentNameById: Record<string, string>;
  canCancel: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "text-zinc-700",
  PARTIALLY_PAID: "text-amber-700",
  PAID: "text-green-700",
  OVERDUE: "text-red-700",
  CANCELLED: "text-zinc-400",
  WAIVED: "text-zinc-400",
};

// Doubles as the Due Management view (requirement 6) — `status`/`fineAmount`/`balance` are the
// live-computed values from list-invoices.service.ts (Decision 4), not stale stored columns.
// Cancellation (Decision 10) is only offered while `amountPaid = 0` — a paid invoice must be
// reversed via the Collect Payment screen first.
export function InvoiceListTable({ invoices, studentNameById, canCancel }: InvoiceListTableProps) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(invoiceId: string) {
    const reason = window.prompt("Reason for cancellation:");
    if (!reason) return;
    setCancellingId(invoiceId);
    setError(null);
    try {
      const result = await cancelInvoiceAction({ invoiceId, reason });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Invoice #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Student</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Period</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Fine</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Balance</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Due Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canCancel && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-2 text-zinc-700">{invoice.invoiceNumber}</td>
                <td className="px-4 py-2 text-zinc-900">{studentNameById[invoice.studentId] ?? invoice.studentId}</td>
                <td className="px-4 py-2 text-zinc-700">{invoice.billingPeriod}</td>
                <td className="px-4 py-2 text-zinc-700">₹{invoice.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">₹{invoice.fineAmount.toFixed(2)}</td>
                <td className="px-4 py-2 font-medium text-zinc-900">₹{invoice.balance.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{invoice.dueDate}</td>
                <td className={`px-4 py-2 font-medium ${STATUS_STYLES[invoice.status] ?? ""}`}>{invoice.status}</td>
                {canCancel && (
                  <td className="px-4 py-2 text-right">
                    {invoice.status !== "CANCELLED" && invoice.amountPaid === 0 && (
                      <button
                        type="button"
                        onClick={() => handleCancel(invoice.id)}
                        disabled={cancellingId === invoice.id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="p-4 text-sm text-zinc-500">No invoices for this filter.</p>}
      </div>
    </div>
  );
}
