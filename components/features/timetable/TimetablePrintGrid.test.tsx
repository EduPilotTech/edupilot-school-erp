import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimetablePrintGrid, type TimetablePrintEntry, type TimetablePrintPeriod } from "./TimetablePrintGrid";

const PERIODS: TimetablePrintPeriod[] = [
  { id: "p1", periodNumber: 1, startTime: "09:00", endTime: "09:45", isBreak: false },
  { id: "p2", periodNumber: 2, startTime: "09:45", endTime: "10:00", isBreak: true },
];

const ENTRIES: TimetablePrintEntry[] = [
  {
    dayOfWeek: "MONDAY",
    periodNumber: 1,
    subjectName: "Mathematics",
    teacherName: "Jane Doe",
    className: "Grade 5",
    sectionName: "A",
    classroomName: "Room 101",
  },
];

describe("TimetablePrintGrid", () => {
  it("renders the title and working-day column headers", () => {
    render(
      <TimetablePrintGrid title="Grade 5 A Timetable" workingDays={["MONDAY", "TUESDAY"]} periods={PERIODS} entries={ENTRIES} />
    );
    expect(screen.getByText("Grade 5 A Timetable")).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Tuesday")).toBeInTheDocument();
  });

  it("renders an occupied cell's subject, teacher, and classroom", () => {
    render(<TimetablePrintGrid title="t" workingDays={["MONDAY"]} periods={PERIODS} entries={ENTRIES} />);
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Room 101")).toBeInTheDocument();
  });

  it("renders a break period as a shaded, spanning row", () => {
    render(<TimetablePrintGrid title="t" workingDays={["MONDAY", "TUESDAY"]} periods={PERIODS} entries={ENTRIES} />);
    const breakCells = screen.getAllByText("Break");
    expect(breakCells).toHaveLength(1);
    expect(breakCells[0].closest("td")).toHaveAttribute("colspan", "2");
  });

  it("shows the class/section when showClassColumn is true", () => {
    render(
      <TimetablePrintGrid
        title="t"
        workingDays={["MONDAY"]}
        periods={PERIODS}
        entries={ENTRIES}
        showClassColumn
      />
    );
    expect(screen.getByText("Grade 5 A")).toBeInTheDocument();
  });
});
