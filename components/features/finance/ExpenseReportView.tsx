"use client";

import { useRef } from "react";
import { FinanceReportPrintControls } from "./FinanceReportPrintControls";
import type { ExpenseReportDTO } from "@/modules/finance/application/dto/finance-reports.dto";

interface ExpenseReportViewProps {
  report: ExpenseReportDTO;
  fileName: string;
}

// The symmetric counterpart of IncomeReportView.
export function ExpenseReportView({ report, fileName }: ExpenseReportViewProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const csvHeaders = ["Date", "Category", "Account", "Amount", "Vendor", "Payment Mode", "Reference No", "Description"];
  const csvRows = report.rows.map((row) => [
    row.date,
    row.expenseCategoryName,
    row.financeAccountName,
    row.amount,
    row.vendor ?? "",
    row.paymentMode,
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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Vendor</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Payment Mode</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Reference No</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report.rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-zinc-700">{row.date}</td>
                <td className="px-4 py-2 text-zinc-900">{row.expenseCategoryName}</td>
                <td className="px-4 py-2 text-zinc-700">{row.financeAccountName}</td>
                <td className="px-4 py-2 text-right text-zinc-700">₹{row.amount.toFixed(2)}</td>
                <td className="px-4 py-2 text-zinc-700">{row.vendor ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{row.paymentMode.replace("_", " ")}</td>
                <td className="px-4 py-2 text-zinc-700">{row.referenceNo ?? "—"}</td>
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
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
        {report.rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No expense entries for this filter.</p>}
      </div>
    </div>
  );
}
