"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateInvoicePdfAction, cancelInvoiceAction } from "@/app/billing/school-actions";
import { RazorpayCheckoutButton } from "@/components/features/billing/RazorpayCheckoutButton";
import type { SubscriptionInvoiceDTO } from "@/modules/billing/application/dto/subscription-invoice.dto";
import type { PaymentDTO } from "@/modules/billing/application/dto/payment.dto";

interface InvoiceDetailProps {
  invoice: SubscriptionInvoiceDTO;
  payments: PaymentDTO[];
  pdfDownloadUrl: string | null;
  canPay: boolean;
  canCancelInvoice: boolean;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  CREATED: "border-zinc-300 bg-zinc-100 text-zinc-600",
  AUTHORIZED: "border-blue-200 bg-blue-50 text-blue-700",
  CAPTURED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
  REFUNDED: "border-amber-200 bg-amber-50 text-amber-700",
  PARTIALLY_REFUNDED: "border-amber-200 bg-amber-50 text-amber-700",
};

function PaymentStatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[status] ?? STATUS_BADGE_STYLES.CREATED}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// Invoice PDF generation is a GST checkbox + rate input (default 18%, default includeGst true)
// calling generateInvoicePdfAction — the same Server Action Step 0 added to school-actions.ts.
// "Pay Now" reuses the shared RazorpayCheckoutButton (also used by the Subscription page's own
// "Renew" flow) rather than duplicating checkout-launch logic. "Cancel Invoice" is only rendered
// at all when the page has already confirmed (server-side, via can(authorization,
// "platform.billing.manage")) that this user actually holds that permission — the Server Action's
// own gate is a second, independent check, never the only one (defense in depth, per every other
// permission-gated control in this codebase).
export function InvoiceDetail({ invoice, payments, pdfDownloadUrl, canPay, canCancelInvoice }: InvoiceDetailProps) {
  const router = useRouter();
  const [includeGst, setIncludeGst] = useState(true);
  const [gstRatePercent, setGstRatePercent] = useState("18");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleGeneratePdf() {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateInvoicePdfAction(invoice.id, {
        includeGst,
        gstRatePercent: includeGst ? Number(gstRatePercent) : undefined,
      });
      if (!result.success) {
        setGenerateError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCancelInvoice() {
    const reason = window.prompt("Reason for cancelling this invoice:");
    if (!reason) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const result = await cancelInvoiceAction(invoice.id, { reason });
      if (!result.success) {
        setCancelError(result.error.message);
        return;
      }
      router.refresh();
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Invoice {invoice.invoiceNumber}</h2>
            <p className="text-sm text-zinc-500">
              {invoice.periodStart} – {invoice.periodEnd} ({invoice.planAtInvoice})
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
            {invoice.status.replace(/_/g, " ")}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Amount</dt>
            <dd className="text-zinc-900">
              {invoice.currency} {invoice.amount.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Tax</dt>
            <dd className="text-zinc-900">
              {invoice.currency} {invoice.taxAmount.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Total</dt>
            <dd className="text-base font-semibold text-zinc-900">
              {invoice.currency} {invoice.totalAmount.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Due Date</dt>
            <dd className="text-zinc-900">{invoice.dueDate}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-start gap-6 border-t border-zinc-100 pt-4">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Invoice PDF</h3>
            {pdfDownloadUrl ? (
              <a href={pdfDownloadUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                Download Invoice PDF
              </a>
            ) : (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" checked={includeGst} onChange={(e) => setIncludeGst(e.target.checked)} />
                  Include GST
                </label>
                {includeGst && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="gst-rate" className="text-xs font-medium text-zinc-500">
                      GST Rate (%)
                    </label>
                    <input
                      id="gst-rate"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={gstRatePercent}
                      onChange={(e) => setGstRatePercent(e.target.value)}
                      className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                  className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating ? "Generating…" : "Generate PDF"}
                </button>
              </div>
            )}
            {generateError && <p className="mt-2 text-sm text-red-600">{generateError}</p>}
          </div>

          {canPay && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payment</h3>
              <div className="mt-2">
                <RazorpayCheckoutButton subscriptionInvoiceId={invoice.id} label="Pay Now" />
              </div>
            </div>
          )}

          {canCancelInvoice && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cancel</h3>
              <button
                type="button"
                onClick={handleCancelInvoice}
                disabled={isCancelling}
                className="mt-2 rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCancelling ? "Cancelling…" : "Cancel Invoice"}
              </button>
              {cancelError && <p className="mt-2 text-sm text-red-600">{cancelError}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Payments Against This Invoice</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Method</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Gateway Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-2 text-zinc-700">{payment.capturedAt ?? "—"}</td>
                  <td className="px-4 py-2 text-zinc-900">
                    {payment.currency} {payment.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-zinc-700">{payment.method ?? "—"}</td>
                  <td className="px-4 py-2">
                    <PaymentStatusPill status={payment.status} />
                  </td>
                  <td className="px-4 py-2 text-zinc-700">{payment.gatewayPaymentId ?? payment.gatewayOrderId}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="p-4 text-sm text-zinc-500">No payments recorded against this invoice yet.</p>}
        </div>
      </div>
    </div>
  );
}
