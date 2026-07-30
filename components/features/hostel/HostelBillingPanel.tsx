"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateHostelMonthlyInvoicesAction, generateHostelOneTimeInvoiceAction } from "@/app/hostel/actions";
import type { HostelFeeRuleDTO } from "@/modules/hostel/application/dto/hostel-fee-rule.dto";

interface StudentOption {
  id: string;
  admissionNumber: string;
  fullName: string;
}

interface HostelBillingPanelProps {
  academicSessionId: string;
  oneTimeRules: HostelFeeRuleDTO[];
  studentOptions: StudentOption[];
}

// Two generation paths mirroring Phase 8's own monthly-vs-one-time split exactly (Phase 10/11
// Decision 1): bulk MONTHLY generation for Hostel Fee / Mess Fee, and a single-student ONE_TIME
// generation for Security Deposit / Fine.
export function HostelBillingPanel({ academicSessionId, oneTimeRules, studentOptions }: HostelBillingPanelProps) {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState("");
  const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false);
  const [monthlyMessage, setMonthlyMessage] = useState<string | null>(null);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);

  const [oneTimeStudentId, setOneTimeStudentId] = useState(studentOptions[0]?.id ?? "");
  const [oneTimeRuleId, setOneTimeRuleId] = useState(oneTimeRules[0]?.id ?? "");
  const [isGeneratingOneTime, setIsGeneratingOneTime] = useState(false);
  const [oneTimeMessage, setOneTimeMessage] = useState<string | null>(null);
  const [oneTimeError, setOneTimeError] = useState<string | null>(null);

  async function handleGenerateMonthly() {
    setIsGeneratingMonthly(true);
    setMonthlyError(null);
    setMonthlyMessage(null);
    try {
      const result = await generateHostelMonthlyInvoicesAction({ academicSessionId, billingPeriod });
      if (!result.success) {
        setMonthlyError(result.error.message);
        return;
      }
      setMonthlyMessage(`${result.data.length} hostel invoice(s) generated.`);
      router.refresh();
    } finally {
      setIsGeneratingMonthly(false);
    }
  }

  async function handleGenerateOneTime() {
    setIsGeneratingOneTime(true);
    setOneTimeError(null);
    setOneTimeMessage(null);
    try {
      const result = await generateHostelOneTimeInvoiceAction({ studentId: oneTimeStudentId, hostelFeeRuleId: oneTimeRuleId });
      if (!result.success) {
        setOneTimeError(result.error.message);
        return;
      }
      setOneTimeMessage(`Invoice ${result.data.invoiceNumber} generated.`);
      router.refresh();
    } finally {
      setIsGeneratingOneTime(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="hostel-billing-period" className="text-xs font-medium text-zinc-500">
            Billing Period (YYYY-MM)
          </label>
          <input
            id="hostel-billing-period"
            type="month"
            value={billingPeriod}
            onChange={(e) => setBillingPeriod(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerateMonthly}
          disabled={isGeneratingMonthly || !billingPeriod}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGeneratingMonthly ? "Generating…" : "Generate Monthly Hostel Invoices"}
        </button>
        {monthlyMessage && <p className="text-sm text-emerald-700">{monthlyMessage}</p>}
        {monthlyError && <p className="text-sm text-red-700">{monthlyError}</p>}
      </div>

      {oneTimeRules.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="hostel-onetime-student" className="text-xs font-medium text-zinc-500">
              Student
            </label>
            <select
              id="hostel-onetime-student"
              value={oneTimeStudentId}
              onChange={(e) => setOneTimeStudentId(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="hostel-onetime-rule" className="text-xs font-medium text-zinc-500">
              One-time Fee (Deposit / Fine)
            </label>
            <select
              id="hostel-onetime-rule"
              value={oneTimeRuleId}
              onChange={(e) => setOneTimeRuleId(e.target.value)}
              className="w-56 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {oneTimeRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.roomType} — {rule.amount.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleGenerateOneTime}
            disabled={isGeneratingOneTime || !oneTimeStudentId || !oneTimeRuleId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingOneTime ? "Generating…" : "Generate One-Time Invoice"}
          </button>
          {oneTimeMessage && <p className="text-sm text-emerald-700">{oneTimeMessage}</p>}
          {oneTimeError && <p className="text-sm text-red-700">{oneTimeError}</p>}
        </div>
      )}
    </div>
  );
}
