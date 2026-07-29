"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateTransportInvoicesAction } from "@/app/transport/actions";

interface TransportBillingPanelProps {
  academicSessionId: string;
}

// Generates one FeeInvoice per (student, MONTHLY RouteFeeRule) for the given billing period —
// the transport analogue of the Fee module's "Generate Monthly Invoices" action (Phase 10
// Decision 1). Idempotent: re-running skips students/rules already invoiced for that period.
export function TransportBillingPanel({ academicSessionId }: TransportBillingPanelProps) {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await generateTransportInvoicesAction({ academicSessionId, billingPeriod });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`${result.data.length} transport invoice(s) generated.`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="billing-period" className="text-xs font-medium text-zinc-500">
          Billing Period (YYYY-MM)
        </label>
        <input
          id="billing-period"
          type="month"
          value={billingPeriod}
          onChange={(e) => setBillingPeriod(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isSubmitting || !billingPeriod}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Generating…" : "Generate Monthly Transport Invoices"}
      </button>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
