import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TimetableBuilder, type TimetableGridCell, type TimetablePeriodRow } from "./TimetableBuilder";
import { createTimetableEntryAction, deleteTimetableEntryAction } from "@/app/timetable/actions";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/timetable/actions", () => ({
  createTimetableEntryAction: vi.fn(),
  deleteTimetableEntryAction: vi.fn(),
}));

const mockedCreate = vi.mocked(createTimetableEntryAction);
const mockedDelete = vi.mocked(deleteTimetableEntryAction);

const PERIODS: TimetablePeriodRow[] = [
  { id: "p1", periodNumber: 1, startTime: "09:00", endTime: "09:45", isBreak: false },
  { id: "p2", periodNumber: 2, startTime: "09:45", endTime: "10:00", isBreak: true },
];

const ASSIGNMENT_OPTIONS = [{ id: "a1", label: "Mathematics — Jane Doe" }];

function renderGrid(entries: TimetableGridCell[] = []) {
  return render(
    <TimetableBuilder
      workingDays={["MONDAY", "TUESDAY"]}
      periods={PERIODS}
      entries={entries}
      assignmentOptions={ASSIGNMENT_OPTIONS}
      classroomOptions={[{ id: "c1", name: "Room 101" }]}
      canManage
    />
  );
}

describe("TimetableBuilder", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    mockedCreate.mockReset();
    mockedDelete.mockReset();
  });

  it("renders a shaded Break row spanning every working day", () => {
    renderGrid();
    const breakCells = screen.getAllByText("Break");
    expect(breakCells).toHaveLength(1);
    expect(breakCells[0].closest("td")).toHaveAttribute("colspan", "2");
  });

  it("shows '+ Add' for an empty, non-break cell when canManage is true", () => {
    renderGrid();
    expect(screen.getAllByRole("button", { name: /\+ add/i }).length).toBeGreaterThan(0);
  });

  it("renders an occupied cell's subject and teacher, with a Clear action", () => {
    renderGrid([
      { id: "e1", dayOfWeek: "MONDAY", periodNumber: 1, subjectName: "Mathematics", teacherName: "Jane Doe", classroomName: null },
    ]);
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("opens the inline editor, saves a new entry, and refreshes on success", async () => {
    mockedCreate.mockResolvedValue({
      success: true,
      data: {
        id: "e1",
        teacherAssignmentId: "a1",
        academicSessionId: "s1",
        classId: "c1",
        sectionId: "sec1",
        subjectId: "subj1",
        teacherId: "t1",
        classroomId: null,
        periodId: "p1",
        dayOfWeek: "MONDAY",
      },
    });

    renderGrid();
    fireEvent.click(screen.getAllByRole("button", { name: /\+ add/i })[0]);

    const [assignmentSelect] = screen.getAllByRole("combobox");
    fireEvent.change(assignmentSelect, { target: { value: "a1" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({
        teacherAssignmentId: "a1",
        periodId: "p1",
        dayOfWeek: "MONDAY",
        classroomId: undefined,
      });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows a conflict error inline without refreshing", async () => {
    mockedCreate.mockResolvedValue({
      success: false,
      error: { code: "TEACHER_CONFLICT", message: "This teacher is already scheduled to teach another class at this day and period." },
    });

    renderGrid();
    fireEvent.click(screen.getAllByRole("button", { name: /\+ add/i })[0]);
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "a1" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText("This teacher is already scheduled to teach another class at this day and period.")
    ).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("clears an existing entry", async () => {
    mockedDelete.mockResolvedValue({ success: true, data: null });

    renderGrid([
      { id: "e1", dayOfWeek: "MONDAY", periodNumber: 1, subjectName: "Mathematics", teacherName: "Jane Doe", classroomName: null },
    ]);
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith("e1");
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
