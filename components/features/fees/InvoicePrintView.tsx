"use client";

import { useRef } from "react";
import { TimetablePrintControls } from "@/components/features/timetable/TimetablePrintControls";
import { InvoiceView, type InvoiceLineItem } from "./InvoiceView";
import type { LetterheadBranding } from "@/components/features/branding/Letterhead";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

interface InvoicePrintViewProps {
  invoice: FeeInvoiceDTO;
  branding: LetterheadBranding;
  studentName: string;
  admissionNumber: string;
  className: string;
  lineItems: InvoiceLineItem[];
  canPrint: boolean;
}

// Reuses TimetablePrintControls verbatim (Print/Export PDF/PNG via html-to-image + jsPDF) —
// same "no new print stack" precedent ReportCardPrintView/ReceiptPrintView already established.
export function InvoicePrintView({ canPrint, ...rest }: InvoicePrintViewProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <TimetablePrintControls targetRef={targetRef} fileName={`invoice-${rest.invoice.invoiceNumber}`} canPrint={canPrint} />
      <div ref={targetRef}>
        <InvoiceView {...rest} />
      </div>
    </div>
  );
}
