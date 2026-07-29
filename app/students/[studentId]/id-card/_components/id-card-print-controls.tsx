"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;

interface IdCardPrintControlsProps {
  frontRef: RefObject<HTMLDivElement | null>;
  backRef: RefObject<HTMLDivElement | null>;
  studentName: string;
  canPrint: boolean;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

// Print: browser-native window.print(), styled by id-card-print.css's @page rule (CR80 size).
// Export PNG/PDF: html-to-image rasterizes the actual rendered card DOM (so exports always match
// what's on screen, no separate drawing logic to keep in sync), jsPDF assembles a real,
// downloadable 2-page PDF sized to the card. Both are gated behind `canPrint` — Teachers get
// view-only access (Sprint 4.9's 3-tier role requirement); this component renders nothing at all
// for them rather than disabled buttons, since there's nothing to explain (no page navigation
// exposes it to them in the first place — see app/students/[studentId]/id-card/page.tsx).
export function IdCardPrintControls({ frontRef, backRef, studentName, canPrint }: IdCardPrintControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canPrint) {
    return null;
  }

  async function handleExportPng() {
    setIsExporting(true);
    setError(null);
    try {
      if (frontRef.current) {
        const frontUrl = await toPng(frontRef.current, { pixelRatio: 3 });
        downloadDataUrl(frontUrl, `${studentName}-id-card-front.png`);
      }
      if (backRef.current) {
        const backUrl = await toPng(backRef.current, { pixelRatio: 3 });
        downloadDataUrl(backUrl, `${studentName}-id-card-back.png`);
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
      const pdf = new jsPDF({ unit: "mm", format: [CARD_WIDTH_MM, CARD_HEIGHT_MM] });

      if (frontRef.current) {
        const frontUrl = await toPng(frontRef.current, { pixelRatio: 3 });
        pdf.addImage(frontUrl, "PNG", 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      }
      if (backRef.current) {
        pdf.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], "landscape");
        const backUrl = await toPng(backRef.current, { pixelRatio: 3 });
        pdf.addImage(backUrl, "PNG", 0, 0, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      }

      pdf.save(`${studentName}-id-card.pdf`);
    } catch {
      setError("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="id-card-screen-only flex flex-wrap items-center gap-3">
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
