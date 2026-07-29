import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClassSummaryTable } from "./ClassSummaryTable";
import type { ClassAttendanceSummaryRow } from "@/modules/attendance/application/dto/attendance-report.dto";

describe("ClassSummaryTable", () => {
  it("shows an empty-state message when there are no rows", () => {
    render(<ClassSummaryTable rows={[]} />);
    expect(screen.getByText(/no students found/i)).toBeInTheDocument();
  });

  it("renders per-status counts and the running total for each student", () => {
    const rows: ClassAttendanceSummaryRow[] = [
      {
        studentId: "s1",
        admissionNumber: "A-001",
        fullName: "Alice Tester",
        counts: { PRESENT: 18, ABSENT: 1, LATE: 1, HALF_DAY: 0, LEAVE: 0, total: 20 },
      },
    ];
    render(<ClassSummaryTable rows={rows} />);

    expect(screen.getByText("Alice Tester")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });
});
