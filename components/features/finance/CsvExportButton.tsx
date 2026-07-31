"use client";

import { downloadCsv } from "./csv-export.helpers";

interface CsvExportButtonProps {
  fileName: string;
  headers: string[];
  rows: (string | number)[][];
  label?: string;
}

// Standalone CSV export for list pages (Income, Expense) — no ref/print/PDF needed here, just the
// currently-filtered rows already rendered server-side. Report pages use the richer
// FinanceReportPrintControls instead, which adds Print + Export PDF alongside the same CSV export.
export function CsvExportButton({ fileName, headers, rows, label = "Export CSV" }: CsvExportButtonProps) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(fileName, headers, rows)}
      className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
    >
      {label}
    </button>
  );
}
