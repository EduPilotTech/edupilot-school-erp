"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateLibraryFineInvoiceAction, waiveBookIssueFineAction } from "@/app/library/actions";
import type { LibraryFineCandidateDTO } from "@/modules/library/application/library-fine.service";

interface FeeCategoryOption {
  id: string;
  name: string;
}

interface FinePanelProps {
  items: LibraryFineCandidateDTO[];
  feeCategories: FeeCategoryOption[];
}

const REASON_LABELS: Record<string, string> = { LATE: "Late Return", LOST: "Lost Book", DAMAGED: "Damaged Book", NONE: "—" };

// Generates a real FeeInvoice for STUDENT members (reusing 100% of the Phase 8 collection/
// receipt/ledger pipeline) or waives the fine — the Administrator Override — for any member type.
export function FinePanel({ items, feeCategories }: FinePanelProps) {
  const router = useRouter();
  const [feeCategoryId, setFeeCategoryId] = useState(feeCategories[0]?.id ?? "");
  const [overrideAmounts, setOverrideAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerateInvoice(bookIssueId: string) {
    setBusyId(bookIssueId);
    setError(null);
    setMessage(null);
    try {
      const overrideRaw = overrideAmounts[bookIssueId];
      const result = await generateLibraryFineInvoiceAction(bookIssueId, {
        feeCategoryId,
        overrideAmount: overrideRaw ? Number(overrideRaw) : undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`Invoice ${result.data.invoiceNumber} generated.`);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleWaive(bookIssueId: string) {
    const reason = window.prompt("Reason for waiving this fine:");
    if (!reason) return;
    setBusyId(bookIssueId);
    setError(null);
    setMessage(null);
    try {
      const result = await waiveBookIssueFineAction(bookIssueId, { reason });
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
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="fine-category" className="text-xs font-medium text-zinc-500">
            Fee Category (for generated invoices)
          </label>
          <select
            id="fine-category"
            value={feeCategoryId}
            onChange={(e) => setFeeCategoryId(e.target.value)}
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {feeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Book</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Member</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reason</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Estimated Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Override</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((candidate) => (
              <tr key={candidate.bookIssueId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{candidate.bookTitle}</td>
                <td className="px-4 py-2 text-zinc-700">
                  {candidate.memberName} <span className="text-xs text-zinc-400">({candidate.memberType})</span>
                </td>
                <td className="px-4 py-2 text-zinc-700">{REASON_LABELS[candidate.reason]}</td>
                <td className="px-4 py-2 text-zinc-700">{candidate.amount.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    placeholder={candidate.amount.toFixed(2)}
                    value={overrideAmounts[candidate.bookIssueId] ?? ""}
                    onChange={(e) => setOverrideAmounts((prev) => ({ ...prev, [candidate.bookIssueId]: e.target.value }))}
                    className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  {candidate.canInvoice ? (
                    <button
                      type="button"
                      onClick={() => handleGenerateInvoice(candidate.bookIssueId)}
                      disabled={busyId === candidate.bookIssueId || !feeCategoryId}
                      className="mr-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      Generate Invoice
                    </button>
                  ) : (
                    <span className="mr-3 text-xs text-zinc-400">Staff/Teacher — manual collection</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleWaive(candidate.bookIssueId)}
                    disabled={busyId === candidate.bookIssueId}
                    className="text-sm text-amber-600 hover:underline disabled:opacity-50"
                  >
                    Waive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No outstanding fines.</p>}
      </div>
    </div>
  );
}
