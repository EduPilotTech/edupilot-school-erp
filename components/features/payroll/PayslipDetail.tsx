"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { recordSalaryPaymentAction, reverseSalaryPaymentAction } from "@/app/payroll/actions";
import type { PayslipWithComponentsDTO } from "@/modules/payroll/application/dto/payroll-run.dto";
import type { SalaryPaymentDTO } from "@/modules/payroll/application/dto/salary-payment.dto";
import { StatusBadge } from "./StatusBadge";
import { PayslipPrintControls } from "./PayslipPrintControls";

interface PayslipDetailProps {
  payslip: PayslipWithComponentsDTO;
  payments: SalaryPaymentDTO[];
  canManagePayments: boolean;
  employeeLabel: string;
}

const PAYMENT_MODES = ["BANK_TRANSFER", "CASH", "CHEQUE", "UPI", "OTHER"] as const;

// Reversal follows components/features/fees/PaymentHistoryTable.tsx's exact precedent: a
// window.prompt() for the reason (reverseSalaryPaymentSchema requires a non-empty one), status
// flip only — the SalaryPayment row itself is never edited or deleted.
export function PayslipDetail({ payslip, payments: initialPayments, canManagePayments, employeeLabel }: PayslipDetailProps) {
  const router = useRouter();
  const printableRef = useRef<HTMLDivElement>(null);
  const [payments, setPayments] = useState(initialPayments);
  const alreadyPaid = payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, Math.round((payslip.netPay - alreadyPaid) * 100) / 100);

  const [amount, setAmount] = useState(remaining > 0 ? remaining.toFixed(2) : "");
  const [paymentMode, setPaymentMode] = useState<(typeof PAYMENT_MODES)[number]>("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reversingId, setReversingId] = useState<string | null>(null);

  const earnings = payslip.components.filter((component) => component.componentType === "EARNING");
  const deductions = payslip.components.filter((component) => component.componentType === "DEDUCTION");

  async function handleRecordPayment() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await recordSalaryPaymentAction({
        payslipId: payslip.id,
        amount: Number(amount),
        paymentMode,
        paymentDate,
        referenceNumber: referenceNumber || undefined,
      });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setPayments((prev) => [result.data, ...prev]);
      setAmount("");
      setPaymentDate("");
      setReferenceNumber("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReverse(payment: SalaryPaymentDTO) {
    const reason = window.prompt("Reason for reversal:");
    if (!reason) return;
    setReversingId(payment.id);
    setError(null);
    try {
      const result = await reverseSalaryPaymentAction({ paymentId: payment.id, reason });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setPayments((prev) => prev.map((existing) => (existing.id === payment.id ? result.data : existing)));
      router.refresh();
    } finally {
      setReversingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <PayslipPrintControls targetRef={printableRef} fileName={`payslip-${payslip.billingPeriod}`} />
      </div>

      <div ref={printableRef} className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Earnings & Deductions</h2>
            <p className="text-sm text-zinc-500">{employeeLabel} — {payslip.billingPeriod}</p>
          </div>
          <StatusBadge status={payslip.status} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Earnings</h3>
            <table className="mt-2 w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-1.5 text-zinc-700">Basic Salary</td>
                  <td className="py-1.5 text-right text-zinc-900">₹{payslip.basicSalary.toFixed(2)}</td>
                </tr>
                {earnings.map((line) => (
                  <tr key={line.id}>
                    <td className="py-1.5 text-zinc-700">{line.name}</td>
                    <td className="py-1.5 text-right text-zinc-900">₹{line.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Deductions</h3>
            <table className="mt-2 w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {deductions.map((line) => (
                  <tr key={line.id}>
                    <td className="py-1.5 text-zinc-700">{line.name}</td>
                    <td className="py-1.5 text-right text-zinc-900">₹{line.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {deductions.length === 0 && (
                  <tr>
                    <td className="py-1.5 text-zinc-500">No deductions</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Gross Earnings</dt>
            <dd className="text-zinc-900">₹{payslip.grossEarnings.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Total Deductions</dt>
            <dd className="text-zinc-900">₹{payslip.totalDeductions.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Loan Recovery</dt>
            <dd className="text-zinc-900">₹{payslip.loanRecoveryAmount.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Net Pay</dt>
            <dd className="text-base font-semibold text-zinc-900">₹{payslip.netPay.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Payments</h2>

        {canManagePayments && (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="payment-amount" className="text-xs font-medium text-zinc-500">
                Amount (₹)
              </label>
              <input
                id="payment-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="payment-mode" className="text-xs font-medium text-zinc-500">
                Mode
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
              <label htmlFor="payment-date" className="text-xs font-medium text-zinc-500">
                Payment Date
              </label>
              <input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="payment-reference" className="text-xs font-medium text-zinc-500">
                Reference # (optional)
              </label>
              <input
                id="payment-reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleRecordPayment}
              disabled={isSubmitting || !amount || !paymentDate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Recording…" : "Record Payment"}
            </button>
            <p className="w-full text-xs text-zinc-500">Outstanding balance: ₹{remaining.toFixed(2)}</p>
          </div>
        )}

        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Mode</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Reference</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
                {canManagePayments && <th className="px-4 py-2 text-right font-medium text-zinc-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-2 text-zinc-900">₹{payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-zinc-700">{payment.paymentMode}</td>
                  <td className="px-4 py-2 text-zinc-700">{payment.paymentDate}</td>
                  <td className="px-4 py-2 text-zinc-700">{payment.referenceNumber ?? "—"}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={payment.status} />
                    {payment.status === "REVERSED" && payment.reversalReason && (
                      <span className="block text-xs text-zinc-400" title={payment.reversalReason}>
                        {payment.reversalReason}
                      </span>
                    )}
                  </td>
                  {canManagePayments && (
                    <td className="px-4 py-2 text-right">
                      {payment.status === "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => handleReverse(payment)}
                          disabled={reversingId === payment.id}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="p-4 text-sm text-zinc-500">No payments recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
