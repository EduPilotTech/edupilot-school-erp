"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { processPayrollRunAction, lockPayrollRunAction, regeneratePayslipAction } from "@/app/payroll/actions";
import type { PayrollRunDTO, PayslipDTO } from "@/modules/payroll/application/dto/payroll-run.dto";
import { StatusBadge } from "./StatusBadge";

interface PayrollRunDetailProps {
  run: PayrollRunDTO;
  payslips: PayslipDTO[];
  // employeeId -> "Full Name (CODE)", pre-joined server-side since this is a Client Component.
  employeeNameById: Record<string, string>;
}

// THE core Phase 13 payroll-processing screen: DRAFT -> Process Payroll -> PROCESSED (per-payslip
// Regenerate + Lock Payroll Run) -> LOCKED (read-only). Local state is seeded from the server
// props and updated in place after each action so the status/totals/payslip rows reflect the
// result immediately, then router.refresh() re-syncs from the server on top of that.
export function PayrollRunDetail({ run: initialRun, payslips: initialPayslips, employeeNameById }: PayrollRunDetailProps) {
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const [payslips, setPayslips] = useState(initialPayslips);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processMessage, setProcessMessage] = useState<string | null>(null);

  async function handleProcess() {
    setIsProcessing(true);
    setError(null);
    setProcessMessage(null);
    try {
      const result = await processPayrollRunAction(run.id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setRun(result.data.payrollRun);
      setProcessMessage(
        `Generated ${result.data.payslipsGenerated} payslip(s).` +
          (result.data.skippedEmployeeIds.length > 0
            ? ` ${result.data.skippedEmployeeIds.length} employee(s) were skipped — no current salary assignment.`
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
        "Lock this payroll run? Once locked, its payslips can no longer be regenerated. This cannot be undone."
      )
    ) {
      return;
    }
    setIsLocking(true);
    setError(null);
    try {
      const result = await lockPayrollRunAction(run.id);
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

  async function handleRegenerate(payslipId: string) {
    setRegeneratingId(payslipId);
    setError(null);
    try {
      const result = await regeneratePayslipAction(payslipId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setPayslips((prev) => prev.map((payslip) => (payslip.id === payslipId ? result.data : payslip)));
      router.refresh();
    } finally {
      setRegeneratingId(null);
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
              {isProcessing ? "Processing…" : "Process Payroll"}
            </button>
          )}
          {run.status === "PROCESSED" && (
            <button
              type="button"
              onClick={handleLock}
              disabled={isLocking}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocking ? "Locking…" : "Lock Payroll Run"}
            </button>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">Total Gross</dt>
            <dd className="text-zinc-900">₹{run.totalGross.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Total Deductions</dt>
            <dd className="text-zinc-900">₹{run.totalDeductions.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Total Net Pay</dt>
            <dd className="text-zinc-900">₹{run.totalNetPay.toFixed(2)}</dd>
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

      {run.status !== "DRAFT" && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">Payslips</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Employee</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Gross Earnings</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Deductions</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Loan Recovery</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Net Pay</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {payslips.map((payslip) => (
                  <tr key={payslip.id}>
                    <td className="px-4 py-2 text-zinc-900">{employeeNameById[payslip.employeeId] ?? payslip.employeeId}</td>
                    <td className="px-4 py-2 text-zinc-700">₹{payslip.grossEarnings.toFixed(2)}</td>
                    <td className="px-4 py-2 text-zinc-700">₹{payslip.totalDeductions.toFixed(2)}</td>
                    <td className="px-4 py-2 text-zinc-700">₹{payslip.loanRecoveryAmount.toFixed(2)}</td>
                    <td className="px-4 py-2 font-medium text-zinc-900">₹{payslip.netPay.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={payslip.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/payroll/payslips/${payslip.id}`} className="mr-3 text-sm text-blue-600 hover:underline">
                        View Detail
                      </Link>
                      {run.status === "PROCESSED" && (
                        <button
                          type="button"
                          onClick={() => handleRegenerate(payslip.id)}
                          disabled={regeneratingId === payslip.id}
                          className="text-sm text-zinc-600 hover:underline disabled:opacity-50"
                        >
                          {regeneratingId === payslip.id ? "Regenerating…" : "Regenerate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payslips.length === 0 && <p className="p-4 text-sm text-zinc-500">No payslips generated.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
