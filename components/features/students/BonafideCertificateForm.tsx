"use client";

import { useRef, useState } from "react";
import { TimetablePrintControls } from "@/components/features/timetable/TimetablePrintControls";
import { BonafideCertificateView } from "./BonafideCertificateView";
import type { LetterheadBranding } from "@/components/features/branding/Letterhead";

interface BonafideCertificateFormProps {
  branding: LetterheadBranding;
  studentName: string;
  admissionNumber: string;
  dateOfBirth: string;
  className: string;
  academicSessionName: string;
  canPrint: boolean;
}

export function BonafideCertificateForm(props: BonafideCertificateFormProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [purpose, setPurpose] = useState("");
  const today = new Date().toLocaleDateString();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 print:hidden">
        <h2 className="text-sm font-medium text-zinc-900">Certificate Details</h2>
        <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Purpose
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Passport application"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      <TimetablePrintControls targetRef={targetRef} fileName={`bonafide-certificate-${props.admissionNumber}`} canPrint={props.canPrint} />

      <div ref={targetRef}>
        <BonafideCertificateView {...props} purpose={purpose} issueDate={today} />
      </div>
    </div>
  );
}
