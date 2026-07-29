"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface TimetablePrintControlsProps {
  targetRef: RefObject<HTMLDivElement | null>;
  fileName: string;
  canPrint: boolean;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

// Print: browser-native window.print(), styled by timetable-print.css's @page rule. Export PNG/
// PDF: html-to-image rasterizes the actual rendered grid DOM (exports always match what's on
// screen), jsPDF wraps it into a downloadable landscape PDF — same stack as Sprint 4.9's
// IdCardPrintControls, reused as-is rather than a new export approach.
export function TimetablePrintControls({ targetRef, fileName, canPrint }: TimetablePrintControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canPrint) {
    return null;
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

  async function handleExportPdf() {
    setIsExporting(true);
    setError(null);
    try {
      if (targetRef.current) {
        const url = await toPng(targetRef.current, { pixelRatio: 2 });
        const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
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
    <div className="timetable-screen-only flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        disabled={isExporting}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
