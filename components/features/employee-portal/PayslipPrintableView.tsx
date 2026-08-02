"use client";

import { useRef } from "react";
import { PayslipPrintControls } from "@/components/features/payroll/PayslipPrintControls";
import { StatusBadge } from "@/components/features/payroll/StatusBadge";
import { LetterheadHeader, LetterheadFooter, type LetterheadBranding } from "@/components/features/branding/Letterhead";
import type { PayslipWithComponentsDTO } from "@/modules/payroll/application/dto/payroll-run.dto";

interface PayslipPrintableViewProps {
  payslip: PayslipWithComponentsDTO;
  branding: LetterheadBranding;
}

// Self-service mirror of components/features/payroll/PayslipDetail.tsx's earnings/deductions
// card — read-only (no payment recording, that's admin-only in app/payroll/**) — with the same
// client-side Print + Download PDF controls (html-to-image + jsPDF, no new architecture).
export function PayslipPrintableView({ payslip, branding }: PayslipPrintableViewProps) {
  const printableRef = useRef<HTMLDivElement>(null);
  const earnings = payslip.components.filter((component) => component.componentType === "EARNING");
  const deductions = payslip.components.filter((component) => component.componentType === "DEDUCTION");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <PayslipPrintControls targetRef={printableRef} fileName={`payslip-${payslip.billingPeriod}`} />
      </div>

      <div ref={printableRef} className="rounded-xl border border-zinc-200 bg-white p-5">
        <LetterheadHeader branding={branding} documentTitle="Salary Slip" />

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Earnings & Deductions</h2>
            <p className="text-sm text-zinc-500">{payslip.billingPeriod}</p>
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

        <LetterheadFooter branding={branding} signatureLabel="Authorized Signatory" />
      </div>
    </div>
  );
}
