"use client";

import { useRef } from "react";
import { FinanceReportPrintControls } from "./FinanceReportPrintControls";
import type { MonthlySummaryReportDTO } from "@/modules/finance/application/dto/finance-reports.dto";

interface MonthlySummaryReportViewProps {
  report: MonthlySummaryReportDTO;
  fileName: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// 12-month table (income/expense/net), one row per calendar month of `report.year` — always all
// 12 rows, since getMonthlySummaryReport always returns exactly 12 (see its own doc comment).
export function MonthlySummaryReportView({ report, fileName }: MonthlySummaryReportViewProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const csvHeaders = ["Month", "Total Income", "Total Expense", "Net Amount"];
  const csvRows = report.rows.map((row) => [MONTH_NAMES[row.month - 1], row.totalIncome, row.totalExpense, row.netAmount]);

  const yearTotals = report.rows.reduce(
    (totals, row) => ({
      income: totals.income + row.totalIncome,
      expense: totals.expense + row.totalExpense,
      net: totals.net + row.netAmount,
    }),
    { income: 0, expense: 0, net: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <FinanceReportPrintControls targetRef={printableRef} fileName={fileName} csvHeaders={csvHeaders} csvRows={csvRows} />
      </div>

      <div ref={printableRef} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Month</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Total Income</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Total Expense</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-500">Net Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report.rows.map((row) => (
              <tr key={row.month}>
                <td className="px-4 py-2 font-medium text-zinc-900">{MONTH_NAMES[row.month - 1]}</td>
                <td className="px-4 py-2 text-right text-emerald-700">₹{row.totalIncome.toFixed(2)}</td>
                <td className="px-4 py-2 text-right text-red-700">₹{row.totalExpense.toFixed(2)}</td>
                <td className={`px-4 py-2 text-right font-medium ${row.netAmount >= 0 ? "text-zinc-900" : "text-red-700"}`}>
                  ₹{row.netAmount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200 bg-zinc-50">
              <td className="px-4 py-2 text-right text-sm font-medium text-zinc-700">Year Total</td>
              <td className="px-4 py-2 text-right text-sm font-semibold text-emerald-700">₹{yearTotals.income.toFixed(2)}</td>
              <td className="px-4 py-2 text-right text-sm font-semibold text-red-700">₹{yearTotals.expense.toFixed(2)}</td>
              <td className="px-4 py-2 text-right text-sm font-semibold text-zinc-900">₹{yearTotals.net.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
