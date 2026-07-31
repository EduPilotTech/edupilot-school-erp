"use client";

import { useRef } from "react";
import { FinanceReportPrintControls } from "./FinanceReportPrintControls";
import type { CategoryWiseIncomeReportDTO } from "@/modules/finance/application/dto/finance-reports.dto";

interface CategoryWiseIncomeReportViewProps {
  report: CategoryWiseIncomeReportDTO;
  fileName: string;
}

export function CategoryWiseIncomeReportView({ report, fileName }: CategoryWiseIncomeReportViewProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const csvHeaders = ["Category", "Total Amount", "Entry Count"];
  const csvRows = report.rows.map((row) => [row.categoryName, row.totalAmount, row.entryCount]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <FinanceReportPrintControls targetRef={printableRef} fileName={fileName} csvHeaders={csvHeaders} csvRows={csvRows} />
      </div>

      <div ref={printableRef} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Category</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Total Amount</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Entry Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report.rows.map((row) => (
              <tr key={row.incomeCategoryId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{row.categoryName}</td>
                <td className="px-4 py-2 text-right text-zinc-700">₹{row.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{row.entryCount}</td>
              </tr>
            ))}
          </tbody>
          {report.rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50">
                <td className="px-4 py-2 text-right text-sm font-medium text-zinc-700">Grand Total</td>
                <td className="px-4 py-2 text-right text-sm font-semibold text-zinc-900">₹{report.grandTotal.toFixed(2)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
        {report.rows.length === 0 && <p className="p-4 text-sm text-zinc-500">No income entries for this filter.</p>}
      </div>
    </div>
  );
}
