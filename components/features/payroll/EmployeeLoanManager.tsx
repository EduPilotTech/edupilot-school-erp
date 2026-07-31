"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmployeeLoanAction, cancelEmployeeLoanAction } from "@/app/payroll/actions";
import type { EmployeeLoanDTO } from "@/modules/payroll/application/dto/employee-loan.dto";
import { StatusBadge } from "./StatusBadge";

interface EmployeeLoanManagerProps {
  employeeId: string;
  items: EmployeeLoanDTO[];
  canManage: boolean;
}

const LOAN_TYPES = ["LOAN", "ADVANCE"] as const;

// Cancel is only offered for ACTIVE loans in the UI; the server still enforces the real rule
// (LoanCannotBeCancelledError — a loan with any recovery already applied can no longer be
// cancelled) and that message surfaces via translatePayrollError if a race lets a stale row
// through.
export function EmployeeLoanManager({ employeeId, items, canManage }: EmployeeLoanManagerProps) {
  const router = useRouter();
  const [loanType, setLoanType] = useState<(typeof LOAN_TYPES)[number]>("LOAN");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [monthlyRecoveryAmount, setMonthlyRecoveryAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createEmployeeLoanAction({
        employeeId,
        loanType,
        principalAmount: Number(principalAmount),
        monthlyRecoveryAmount: Number(monthlyRecoveryAmount),
        startDate,
        reason: reason || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setPrincipalAmount("");
      setMonthlyRecoveryAmount("");
      setStartDate("");
      setReason("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(loan: EmployeeLoanDTO) {
    if (!window.confirm("Cancel this loan/advance?")) return;
    setBusyId(loan.id);
    setError(null);
    try {
      const result = await cancelEmployeeLoanAction(loan.id);
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
      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="loan-type" className="text-xs font-medium text-zinc-500">
              Type
            </label>
            <select
              id="loan-type"
              value={loanType}
              onChange={(e) => setLoanType(e.target.value as (typeof LOAN_TYPES)[number])}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            >
              {LOAN_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="loan-principal" className="text-xs font-medium text-zinc-500">
              Principal (₹)
            </label>
            <input
              id="loan-principal"
              type="number"
              min={0}
              step="0.01"
              value={principalAmount}
              onChange={(e) => setPrincipalAmount(e.target.value)}
              className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="loan-recovery" className="text-xs font-medium text-zinc-500">
              Monthly Recovery (₹)
            </label>
            <input
              id="loan-recovery"
              type="number"
              min={0}
              step="0.01"
              value={monthlyRecoveryAmount}
              onChange={(e) => setMonthlyRecoveryAmount(e.target.value)}
              className="w-36 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="loan-start" className="text-xs font-medium text-zinc-500">
              Start Date
            </label>
            <input
              id="loan-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="loan-reason" className="text-xs font-medium text-zinc-500">
              Reason (optional)
            </label>
            <input
              id="loan-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-48 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !principalAmount || !monthlyRecoveryAmount || !startDate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating…" : "Issue Loan/Advance"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Principal</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Monthly Recovery</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Outstanding</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Start Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reason</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              {canManage && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((loan) => (
              <tr key={loan.id}>
                <td className="px-4 py-2 text-zinc-900">{loan.loanType}</td>
                <td className="px-4 py-2 text-zinc-700">₹{loan.principalAmount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">₹{loan.monthlyRecoveryAmount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">₹{loan.outstandingAmount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{loan.startDate}</td>
                <td className="max-w-[200px] truncate px-4 py-2 text-zinc-700" title={loan.reason ?? undefined}>
                  {loan.reason ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={loan.status} />
                </td>
                {canManage && (
                  <td className="px-4 py-2 text-right">
                    {loan.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(loan)}
                        disabled={busyId === loan.id}
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
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No loans or advances for this employee.</p>}
      </div>
    </div>
  );
}
