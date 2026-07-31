"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface PayslipPrintControlsProps {
  targetRef: RefObject<HTMLDivElement | null>;
  fileName: string;
}

// Payslip PDF — reuses the exact same client-side export stack as
// components/features/fees/ReceiptPrintControls.tsx (html-to-image + jsPDF, no server round-trip,
// no new library, no new architecture): capture the printable area as a PNG, then place it on one
// A4 jsPDF page. Trimmed to Print + Export PDF only (no Thermal/PNG — not meaningful for a
// payslip), per the Phase 13 "simple private-school salary model" scope: Monthly Salary, Salary
// Revision History, Salary Payment, Payslip PDF — nothing statutory-calculation-specific.
export function PayslipPrintControls({ targetRef, fileName }: PayslipPrintControlsProps) {
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
        {isExporting ? "Exporting…" : "Download PDF"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
