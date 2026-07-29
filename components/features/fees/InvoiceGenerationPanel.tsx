"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  generateMonthlyInvoicesAction,
  generateOneTimeInvoiceAction,
  generateInstallmentInvoicesAction,
} from "@/app/fees/billing/actions";

interface Option {
  id: string;
  label: string;
}

interface InvoiceGenerationPanelProps {
  academicSessionId: string;
  oneTimeItems: Option[];
  installmentItems: Option[];
  students: Option[];
}

// Three bulk/on-demand generation flows (Phase 8 requirements 5, 9, 12) — Monthly is idempotent
// and bulk (loops every MONTHLY-frequency assignment for the billing period), Installment is bulk
// per opted-in student, One-time is a single student+item action.
export function InvoiceGenerationPanel({
  academicSessionId,
  oneTimeItems,
  installmentItems,
  students,
}: InvoiceGenerationPanelProps) {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState("");
  const [oneTimeStudentId, setOneTimeStudentId] = useState(students[0]?.id ?? "");
  const [oneTimeItemId, setOneTimeItemId] = useState(oneTimeItems[0]?.id ?? "");
  const [installmentItemId, setInstallmentItemId] = useState(installmentItems[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateMonthly() {
    setIsSubmitting("monthly");
    setError(null);
    setMessage(null);
    try {
      const result = await generateMonthlyInvoicesAction({ academicSessionId, billingPeriod });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`${result.data.length} monthly invoice(s) generated.`);
      router.refresh();
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handleGenerateOneTime() {
    setIsSubmitting("onetime");
    setError(null);
    setMessage(null);
    try {
      const result = await generateOneTimeInvoiceAction({
        studentId: oneTimeStudentId,
        feeStructureItemId: oneTimeItemId,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`Invoice ${result.data.invoiceNumber} generated.`);
      router.refresh();
    } finally {
      setIsSubmitting(null);
    }
  }

  async function handleGenerateInstallment() {
    setIsSubmitting("installment");
    setError(null);
    setMessage(null);
    try {
      const result = await generateInstallmentInvoicesAction({
        academicSessionId,
        feeStructureItemId: installmentItemId,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setMessage(`${result.data.length} installment invoice(s) generated.`);
      router.refresh();
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{message}</p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Generate Monthly Invoices</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Bills every student assigned to a MONTHLY fee item for the given month. Idempotent — safe to re-run.
        </p>
        <div className="mt-3 flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="billing-period" className="text-xs font-medium text-zinc-500">
              Billing Period
            </label>
            <input
              id="billing-period"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              placeholder="2026-04"
              className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateMonthly}
            disabled={isSubmitting === "monthly" || !billingPeriod}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting === "monthly" ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {installmentItems.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Generate Installment Invoices</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Bills every student who opted into an installment plan for the selected fee item.
          </p>
          <div className="mt-3 flex items-end gap-3">
            <select
              value={installmentItemId}
              onChange={(e) => setInstallmentItemId(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {installmentItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleGenerateInstallment}
              disabled={isSubmitting === "installment"}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting === "installment" ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      )}

      {oneTimeItems.length > 0 && students.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Generate One-time Invoice</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Admission, registration, ID card, and other one-time charges — for a single student.
          </p>
          <div className="mt-3 flex items-end gap-3">
            <select
              value={oneTimeStudentId}
              onChange={(e) => setOneTimeStudentId(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.label}
                </option>
              ))}
            </select>
            <select
              value={oneTimeItemId}
              onChange={(e) => setOneTimeItemId(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {oneTimeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleGenerateOneTime}
              disabled={isSubmitting === "onetime"}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting === "onetime" ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
