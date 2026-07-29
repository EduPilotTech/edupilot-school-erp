"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reversePaymentAction } from "@/app/fees/collect/actions";
import type { FeePaymentDTO } from "@/modules/fees/application/dto/fee-payment.dto";

interface PaymentHistoryTableProps {
  payments: FeePaymentDTO[];
  canReverse: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "text-green-700",
  REVERSED: "text-red-700",
  CANCELLED: "text-zinc-400",
};

// Reversal (Decision 10) is a status flip on the immutable FeePayment (Decision 5), never a value
// edit or delete — `fee.payment.reverse` is a narrower permission than `fee.payment.collect`
// (Cashier holds only the latter), so this button only renders for Accountant/Admin.
export function PaymentHistoryTable({ payments, canReverse }: PaymentHistoryTableProps) {
  const router = useRouter();
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReverse(paymentId: string) {
    const reason = window.prompt("Reason for reversal:");
    if (!reason) return;
    setReversingId(paymentId);
    setError(null);
    try {
      const result = await reversePaymentAction({ paymentId, reason });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setReversingId(null);
    }
  }

  if (payments.length === 0) {
    return <p className="text-sm text-zinc-500">No payments recorded yet.</p>;
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Receipt #</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Mode</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-2 text-zinc-700">{payment.receiptNumber}</td>
                <td className="px-4 py-2 text-zinc-700">{new Date(payment.paidAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-zinc-700">₹{payment.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{payment.paymentMode}</td>
                <td className={`px-4 py-2 font-medium ${STATUS_STYLES[payment.status] ?? ""}`}>{payment.status}</td>
                <td className="px-4 py-2 text-right">
                  <a
                    href={`/fees/collect/${payment.id}/receipt`}
                    className="mr-3 text-sm text-blue-600 hover:underline"
                  >
                    Receipt
                  </a>
                  {canReverse && payment.status === "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => handleReverse(payment.id)}
                      disabled={reversingId === payment.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Reverse
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
