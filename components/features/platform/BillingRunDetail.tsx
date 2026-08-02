"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processBillingRunAction, lockBillingRunAction } from "@/app/billing/platform-actions";
import type { BillingRunDTO } from "@/modules/billing/application/dto/billing-run.dto";
import { StatusBadge } from "./StatusBadge";

interface BillingRunDetailProps {
  run: BillingRunDTO;
}

// THE core Bundle A billing-run-processing screen for Platform Admin: DRAFT -> Process Billing
// Run -> PROCESSED (shows invoicesGenerated/skippedTenantIds) -> Lock Billing Run -> LOCKED
// (read-only). Mirrors components/features/payroll/PayrollRunDetail.tsx's exact shape: local
// state seeded from the server prop, updated in place after each action, then router.refresh()
// re-syncs from the server on top of that.
export function BillingRunDetail({ run: initialRun }: BillingRunDetailProps) {
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processMessage, setProcessMessage] = useState<string | null>(null);
  const [skippedTenantIds, setSkippedTenantIds] = useState<string[]>([]);

  async function handleProcess() {
    setIsProcessing(true);
    setError(null);
    setProcessMessage(null);
    try {
      const result = await processBillingRunAction(run.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setRun(result.data.billingRun);
      setSkippedTenantIds(result.data.skippedTenantIds);
      setProcessMessage(
        `Generated ${result.data.invoicesGenerated} invoice(s).` +
          (result.data.skippedTenantIds.length > 0
            ? ` ${result.data.skippedTenantIds.length} school(s) were skipped.`
            : "")
      );
      router.refresh();
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleLock() {
    if (
      !window.confirm(
        "Lock this billing run? Once locked, it can no longer be modified. This cannot be undone."
      )
    ) {
      return;
    }
    setIsLocking(true);
    setError(null);
    try {
      const result = await lockBillingRunAction(run.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setRun(result.data);
      router.refresh();
    } finally {
      setIsLocking(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">{run.billingPeriod}</h2>
            <StatusBadge status={run.status} />
          </div>
          {run.status === "DRAFT" && (
            <button
              type="button"
              onClick={handleProcess}
              disabled={isProcessing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? "Processing…" : "Process Billing Run"}
            </button>
          )}
          {run.status === "PROCESSED" && (
            <button
              type="button"
              onClick={handleLock}
              disabled={isLocking}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocking ? "Locking…" : "Lock Billing Run"}
            </button>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">Total Invoices Generated</dt>
            <dd className="text-zinc-900">{run.totalInvoicesGenerated}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Total Amount Billed</dt>
            <dd className="text-zinc-900">₹{run.totalAmountBilled.toFixed(2)}</dd>
          </div>
        </dl>

        {run.processedAt && (
          <p className="mt-3 text-xs text-zinc-500">Processed at {new Date(run.processedAt).toLocaleString()}.</p>
        )}
        {run.status === "LOCKED" && run.lockedAt && (
          <p className="text-xs text-zinc-500">Locked at {new Date(run.lockedAt).toLocaleString()}.</p>
        )}

        {processMessage && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {processMessage}
          </p>
        )}
        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      </div>

      {skippedTenantIds.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Skipped Schools</h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <ul className="divide-y divide-zinc-100 text-sm">
              {skippedTenantIds.map((tenantId) => (
                <li key={tenantId} className="px-4 py-2 text-zinc-700">
                  {tenantId}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
