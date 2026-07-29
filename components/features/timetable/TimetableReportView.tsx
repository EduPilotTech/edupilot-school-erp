"use client";

import { useRef } from "react";
import { TimetablePrintGrid, type TimetablePrintEntry, type TimetablePrintPeriod } from "./TimetablePrintGrid";
import { TimetablePrintControls } from "./TimetablePrintControls";

interface TimetableReportViewProps {
  title: string;
  subtitle?: string;
  workingDays: string[];
  periods: TimetablePrintPeriod[];
  entries: TimetablePrintEntry[];
  showClassColumn?: boolean;
  fileName: string;
  canPrint: boolean;
}

// Owns the DOM ref the print/export controls need — TimetablePrintGrid itself stays a plain,
// ref-free presentational component (no "use client" needed there) since only this wrapper
// touches html-to-image.
export function TimetableReportView({
  title,
  subtitle,
  workingDays,
  periods,
  entries,
  showClassColumn,
  fileName,
  canPrint,
}: TimetableReportViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <TimetablePrintControls targetRef={gridRef} fileName={fileName} canPrint={canPrint} />
      <div ref={gridRef}>
        <TimetablePrintGrid
          title={title}
          subtitle={subtitle}
          workingDays={workingDays}
          periods={periods}
          entries={entries}
          showClassColumn={showClassColumn}
        />
      </div>
    </div>
  );
}
