"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collectPaymentAction } from "@/app/fees/collect/actions";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

interface PaymentCollectionFormProps {
  studentId: string;
  academicSessionId: string;
  outstandingInvoices: FeeInvoiceDTO[];
}

const PAYMENT_MODES = ["CASH", "CHEQUE", "UPI", "CARD", "BANK_TRANSFER", "ONLINE"] as const;

// `clientRequestId` is generated once per form mount and never regenerated on re-render — the
// idempotency key that makes a double-click/retry safe (Phase 8 double-payment prevention): a
// duplicate submit with the same key returns the original payment instead of creating a second
// one (see collect-payment.service.ts).
export function PaymentCollectionForm({
  studentId,
  academicSessionId,
  outstandingInvoices,
}: PaymentCollectionFormProps) {
  const router = useRouter();
  const [clientRequestId] = useState(() => crypto.randomUUID());
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(outstandingInvoices.map((invoice) => [invoice.id, false]))
  );
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(outstandingInvoices.map((invoice) => [invoice.id, invoice.balance.toFixed(2)]))
  );
  const [paymentMode, setPaymentMode] = useState<(typeof PAYMENT_MODES)[number]>("CASH");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSelected = outstandingInvoices
    .filter((invoice) => selected[invoice.id])
    .reduce((sum, invoice) => sum + (Number(amounts[invoice.id]) || 0), 0);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const allocations = outstandingInvoices
        .filter((invoice) => selected[invoice.id])
        .map((invoice) => ({ invoiceId: invoice.id, amount: Number(amounts[invoice.id]) }));

      if (allocations.length === 0) {
        setError("Select at least one invoice to collect payment for.");
        return;
      }

      const result = await collectPaymentAction({
        studentId,
        academicSessionId,
        clientRequestId,
        paymentMode,
        remarks: remarks || undefined,
        allocations,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.push(`/fees/collect/${result.data.id}/receipt`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (outstandingInvoices.length === 0) {
    return <p className="text-sm text-zinc-500">This student has no outstanding invoices.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500" />
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Invoice #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Period</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Balance</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount to Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {outstandingInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected[invoice.id]}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [invoice.id]: e.target.checked }))}
                  />
                </td>
                <td className="px-4 py-2 text-zinc-700">{invoice.invoiceNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{invoice.billingPeriod}</td>
                <td className="px-4 py-2 text-zinc-700">₹{invoice.balance.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    max={invoice.balance}
                    step="0.01"
                    disabled={!selected[invoice.id]}
                    value={amounts[invoice.id]}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [invoice.id]: e.target.value }))}
                    className="w-28 rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-100"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="payment-mode" className="text-xs font-medium text-zinc-500">
            Payment Mode
          </label>
          <select
            id="payment-mode"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as (typeof PAYMENT_MODES)[number])}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="remarks" className="text-xs font-medium text-zinc-500">
            Remarks (optional)
          </label>
          <input
            id="remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <p className="text-sm font-medium text-zinc-900">Total: ₹{totalSelected.toFixed(2)}</p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || totalSelected <= 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Collecting…" : "Collect Payment"}
        </button>
      </div>
    </div>
  );
}
