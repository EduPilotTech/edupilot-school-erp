import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudentReportTable } from "./StudentReportTable";
import type { StudentAttendanceReportEntry } from "@/modules/attendance/application/dto/attendance-report.dto";

describe("StudentReportTable", () => {
  it("shows an empty-state message when there are no entries", () => {
    render(<StudentReportTable entries={[]} />);
    expect(screen.getByText(/no attendance records/i)).toBeInTheDocument();
  });

  it("renders each entry's date, status, and remarks", () => {
    const entries: StudentAttendanceReportEntry[] = [
      { date: new Date("2026-07-28"), status: "LATE", remarks: "Bus delay" },
      { date: new Date("2026-07-29"), status: "PRESENT", remarks: null },
    ];
    render(<StudentReportTable entries={entries} />);

    expect(screen.getByText("2026-07-28")).toBeInTheDocument();
    expect(screen.getByText("Late")).toBeInTheDocument();
    expect(screen.getByText("Bus delay")).toBeInTheDocument();
    expect(screen.getByText("2026-07-29")).toBeInTheDocument();
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
