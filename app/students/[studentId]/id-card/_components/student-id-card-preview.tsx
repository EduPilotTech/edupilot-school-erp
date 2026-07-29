"use client";

import { useRef } from "react";
import { IdCardFront } from "./id-card-front";
import { IdCardBack } from "./id-card-back";
import { IdCardPrintControls } from "./id-card-print-controls";
import type { StudentIdCardDTO } from "@/modules/students/application/dto/student-id-card.dto";

interface StudentIdCardPreviewProps {
  card: StudentIdCardDTO;
  canPrint: boolean;
}

// Responsive Preview: front/back shown side-by-side (stacked on narrow screens via flex-wrap),
// scaled up from the card's true mm size so it's actually legible on screen — the scale wrapper
// is screen-only (`id-card-screen-only`, hidden by id-card-print.css) so printing/exporting still
// captures the card at its real, unscaled size via the refs below.
export function StudentIdCardPreview({ card, canPrint }: StudentIdCardPreviewProps) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <IdCardPrintControls frontRef={frontRef} backRef={backRef} studentName={card.student.fullName} canPrint={canPrint} />

      <div className="id-card-screen-only flex flex-wrap items-start gap-8">
        <div className="origin-top-left scale-150 sm:scale-[1.75]">
          <div ref={frontRef}>
            <IdCardFront card={card} />
          </div>
        </div>
        <div className="origin-top-left scale-150 sm:scale-[1.75]">
          <div ref={backRef}>
            <IdCardBack card={card} />
          </div>
        </div>
      </div>

      {/* Print-only: unscaled, real-size card faces, each on its own CR80 page. */}
      <div id="id-card-print-area" className="hidden print:block">
        <div className="id-card-print-page">
          <IdCardFront card={card} />
        </div>
        <div className="id-card-print-page">
          <IdCardBack card={card} />
        </div>
      </div>
    </div>
  );
}
