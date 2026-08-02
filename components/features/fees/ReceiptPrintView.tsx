"use client";

import { useRef } from "react";
import { ReceiptView, type ReceiptLineItem } from "./ReceiptView";
import { ReceiptPrintControls } from "./ReceiptPrintControls";
import type { FeePaymentDTO } from "@/modules/fees/application/dto/fee-payment.dto";

interface ReceiptPrintViewProps {
  schoolName: string;
  schoolAddress: string;
  logoUrl?: string | null;
  footerText?: string | null;
  payment: FeePaymentDTO;
  studentName: string;
  admissionNumber: string;
  className: string;
  lineItems: ReceiptLineItem[];
}

// Client wrapper reusing ReceiptPrintControls, mirroring ReportCardPrintView.tsx's own shape from
// Phase 7 — the ref wraps both print areas ReceiptView renders, but only the A4 area is visible
// on screen (the thermal area is `display: none` outside of print, see receipt-print.css), so
// PDF/PNG export captures only the A4 content.
export function ReceiptPrintView(props: ReceiptPrintViewProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <ReceiptPrintControls targetRef={targetRef} fileName={`receipt-${props.payment.receiptNumber}`} />
      <div ref={targetRef}>
        <ReceiptView {...props} />
      </div>
    </div>
  );
}
