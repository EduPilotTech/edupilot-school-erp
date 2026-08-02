"use client";

import { useRef, useState } from "react";
import { TimetablePrintControls } from "@/components/features/timetable/TimetablePrintControls";
import { TransferCertificateView, type TransferCertificateFields } from "./TransferCertificateView";
import type { LetterheadBranding } from "@/components/features/branding/Letterhead";

interface TransferCertificateFormProps {
  branding: LetterheadBranding;
  studentName: string;
  admissionNumber: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  className: string;
  academicSessionName: string;
  admissionDate: string;
  canPrint: boolean;
}

// Client-owned form state for the fields with no backing column anywhere (reason for leaving,
// date of leaving, conduct, remarks) — the certificate preview below updates live as they're
// typed, same "live preview, not just post-save" pattern as BrandingPreviewCard/
// SchoolBrandingManager.
export function TransferCertificateForm(props: TransferCertificateFormProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [fields, setFields] = useState<TransferCertificateFields>({
    reasonForLeaving: "",
    dateOfLeaving: "",
    conduct: "Good",
    remarks: "",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 print:hidden">
        <h2 className="text-sm font-medium text-zinc-900">Certificate Details</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
            Date of Leaving
            <input
              type="date"
              value={fields.dateOfLeaving}
              onChange={(e) => setFields((prev) => ({ ...prev, dateOfLeaving: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
            Conduct
            <input
              value={fields.conduct}
              onChange={(e) => setFields((prev) => ({ ...prev, conduct: e.target.value }))}
              placeholder="Good"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 sm:col-span-2">
            Reason for Leaving
            <input
              value={fields.reasonForLeaving}
              onChange={(e) => setFields((prev) => ({ ...prev, reasonForLeaving: e.target.value }))}
              placeholder="Family relocation"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500 sm:col-span-2">
            Remarks (optional)
            <input
              value={fields.remarks}
              onChange={(e) => setFields((prev) => ({ ...prev, remarks: e.target.value }))}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
            />
          </label>
        </div>
      </div>

      <TimetablePrintControls targetRef={targetRef} fileName={`transfer-certificate-${props.admissionNumber}`} canPrint={props.canPrint} />

      <div ref={targetRef}>
        <TransferCertificateView {...props} fields={fields} />
      </div>
    </div>
  );
}
