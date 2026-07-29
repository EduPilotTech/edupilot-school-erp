import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyReportTable } from "./DailyReportTable";
import type { DailyAttendanceReportRow } from "@/modules/attendance/application/dto/attendance-report.dto";

describe("DailyReportTable", () => {
  it("shows an empty-state message when there are no rows", () => {
    render(<DailyReportTable rows={[]} />);
    expect(screen.getByText(/no students found/i)).toBeInTheDocument();
  });

  it("renders each student's admission number, name, and status label", () => {
    const rows: DailyAttendanceReportRow[] = [
      { studentId: "s1", admissionNumber: "A-001", fullName: "Alice Tester", status: "PRESENT" },
      { studentId: "s2", admissionNumber: "A-002", fullName: "Bob Tester", status: "HALF_DAY" },
    ];
    render(<DailyReportTable rows={rows} />);

    expect(screen.getByText("A-001")).toBeInTheDocument();
    expect(screen.getByText("Alice Tester")).toBeInTheDocument();
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.getByText("Half Day")).toBeInTheDocument();
  });

  it("shows 'Not Marked' for a null status", () => {
    const rows: DailyAttendanceReportRow[] = [
      { studentId: "s1", admissionNumber: "A-001", fullName: "Alice Tester", status: null },
    ];
    render(<DailyReportTable rows={rows} />);
    expect(screen.getByText("Not Marked")).toBeInTheDocument();
  });
});
