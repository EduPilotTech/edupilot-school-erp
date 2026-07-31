"use client";

import { useRef } from "react";
import { FinanceReportPrintControls } from "./FinanceReportPrintControls";
import type { IncomeReportDTO } from "@/modules/finance/application/dto/finance-reports.dto";

interface IncomeReportViewProps {
  report: IncomeReportDTO;
  fileName: string;
}

// Client wrapper holding the printable ref + Print/PDF/CSV controls, mirroring
// components/features/employee-portal/PayslipPrintableView.tsx's exact "wrap a server-fetched DTO
// in a client component for the ref" reasoning — the page itself stays a Server Component.
export function IncomeReportView({ report, fileName }: IncomeReportViewProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const csvHeaders = ["Date", "Category", "Account", "Amount", "Reference No", "Description"];
  const csvRows = report.rows.map((row) => [
    row.date,
    row.incomeCategoryName,
    row.financeAccountName,
    row.amount,
    row.referenceNo ?? "",
    row.description ?? "",
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <FinanceReportPrintControls targetRef={printableRef} fileName={fileName} csvHeaders={csvHeaders} csvRows={csvRows} />
      </div>

      <div ref={printableRef} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Category</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Account</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Amount</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reference No</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report.rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-zinc-700">{row.date}</td>
                <td className="px-4 py-2 text-zinc-900">{row.incomeCategoryName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.financeAccountName}</td>
                <td className="px-4 py-2 text-right text-zinc-700">₹{row.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{row.referenceNo ?? "—"}</td>
                <td className="max-w-[240px] truncate px-4 py-2 text-zinc-700" title={row.description ?? undefined}>
                  {row.description ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
          {report.rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50">
                <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-zinc-700">
                  Total
                </td>
                <td className="px-4 py-2 text-right text-sm font-semibold text-zinc-900">₹{report.totalAmount.toFixed(2)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
        {report.rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No income entries for this filter.</p>}
      </div>
    </div>
  );
}
