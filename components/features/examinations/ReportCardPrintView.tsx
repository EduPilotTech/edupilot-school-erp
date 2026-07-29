"use client";

import { useRef } from "react";
import { ReportCardView } from "./ReportCardView";
import { TimetablePrintControls } from "@/components/features/timetable/TimetablePrintControls";
import type { ReportCardDTO } from "@/modules/examinations/application/dto/report-card.dto";

interface ReportCardPrintViewProps {
  reportCard: ReportCardDTO;
  canPrint: boolean;
}

// Owns the DOM ref the print/export controls need — reuses TimetablePrintControls directly
// (Phase 7 Decision 6: reuse the existing print/export stack, no new libraries, no near-duplicate
// component) since it's already fully generic (targetRef + fileName + canPrint, nothing
// timetable-specific inside it).
export function ReportCardPrintView({ reportCard, canPrint }: ReportCardPrintViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <TimetablePrintControls
        targetRef={cardRef}
        fileName={`${reportCard.fullName}-${reportCard.examName}-report-card`}
        canPrint={canPrint}
      />
      <div ref={cardRef}>
        <ReportCardView reportCard={reportCard} />
      </div>
    </div>
  );
}
