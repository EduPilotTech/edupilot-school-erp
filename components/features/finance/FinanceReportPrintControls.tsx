"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { downloadCsv } from "./csv-export.helpers";

interface FinanceReportPrintControlsProps {
  targetRef: RefObject<HTMLDivElement | null>;
  fileName: string;
  csvHeaders: string[];
  csvRows: (string | number)[][];
}

// Every Finance report's Print + Export PDF + Export CSV bar. Print/PDF reuse the exact same
// client-side export stack as components/features/payroll/PayslipPrintControls.tsx (html-to-image
// + jsPDF, no server round-trip, no new library): capture the printable area as a PNG, then place
// it on one A4 jsPDF page. CSV export reuses csv-export.helpers.ts's downloadCsv on the same rows
// the printable table renders, so all three exports are always in sync with what's on screen.
export function FinanceReportPrintControls({ targetRef, fileName, csvHeaders, csvRows }: FinanceReportPrintControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePrint() {
    window.print();
  }

  async function handleExportPdf() {
    setIsExporting(true);
    setError(null);
    try {
      if (targetRef.current) {
        const url = await toPng(targetRef.current, { pixelRatio: 2 });
        const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const image = new Image();
        image.src = url;
        await new Promise((resolve) => {
          image.onload = resolve;
        });
        const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
        pdf.addImage(url, "PNG", 0, 0, image.width * scale, image.height * scale);
        pdf.save(`${fileName}.pdf`);
      }
    } catch {
      setError("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleExportCsv() {
    downloadCsv(fileName, csvHeaders, csvRows);
  }

  return (
    <div className="print:hidden flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handlePrint}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Print
      </button>
      <button
        type="button"
        onClick={handleExportPdf}
        disabled={isExporting}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExporting ? "Exporting…" : "Export PDF"}
      </button>
      <button
        type="button"
        onClick={handleExportCsv}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
      >
        Export CSV
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
