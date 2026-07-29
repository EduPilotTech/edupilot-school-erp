"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface ReceiptPrintControlsProps {
  targetRef: RefObject<HTMLDivElement | null>;
  fileName: string;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

// A4 print/export reuses the same stack as TimetablePrintControls (window.print + html-to-image +
// jsPDF) — no new libraries (Decision 12). Thermal is print-only (no PDF/PNG — not a standard use
// case for an 80mm receipt): toggling `document.documentElement.dataset.printMode` synchronously,
// right before `window.print()`, selects which named `@page` (see receipt-print.css) and which of
// the two areas in ReceiptView is visible, with no React-state timing race against the print
// dialog opening.
export function ReceiptPrintControls({ targetRef, fileName }: ReceiptPrintControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function printA4() {
    document.documentElement.dataset.printMode = "a4";
    window.print();
  }

  function printThermal() {
    document.documentElement.dataset.printMode = "thermal";
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

  async function handleExportPng() {
    setIsExporting(true);
    setError(null);
    try {
      if (targetRef.current) {
        const url = await toPng(targetRef.current, { pixelRatio: 2 });
        downloadDataUrl(url, `${fileName}.png`);
      }
    } catch {
      setError("Failed to export PNG. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="receipt-screen-only flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={printA4}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Print (A4)
      </button>
      <button
        type="button"
        onClick={printThermal}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
      >
        Print (Thermal)
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
        onClick={handleExportPng}
        disabled={isExporting}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExporting ? "Exporting…" : "Export PNG"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
