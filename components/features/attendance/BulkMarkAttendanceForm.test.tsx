import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BulkMarkAttendanceForm, type BulkMarkAttendanceRow } from "./BulkMarkAttendanceForm";
import { bulkMarkAttendanceAction } from "@/app/attendance/actions";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/attendance/actions", () => ({
  bulkMarkAttendanceAction: vi.fn(),
}));

const mockedBulkMarkAction = vi.mocked(bulkMarkAttendanceAction);

const ROWS: BulkMarkAttendanceRow[] = [
  { studentId: "student-1", admissionNumber: "A-001", fullName: "Alice Tester", status: null },
  { studentId: "student-2", admissionNumber: "A-002", fullName: "Bob Tester", status: "ABSENT" },
];

function renderForm(rows: BulkMarkAttendanceRow[] = ROWS) {
  return render(
    <BulkMarkAttendanceForm
      academicSessionId="session-1"
      classId="class-1"
      sectionId="section-1"
      date="2026-07-28"
      rows={rows}
    />
  );
}

describe("BulkMarkAttendanceForm", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    mockedBulkMarkAction.mockReset();
  });

  it("shows a message instead of a table when there are no students", () => {
    renderForm([]);
    expect(screen.getByText(/no students found/i)).toBeInTheDocument();
  });

  it("defaults an unmarked student to PRESENT and keeps an already-marked student's status", () => {
    renderForm();
    const selects = screen.getAllByRole("combobox");
    expect(selects[0]).toHaveValue("PRESENT");
    expect(selects[1]).toHaveValue("ABSENT");
  });

  it("marks every student present when 'Mark All Present' is clicked", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /mark all present/i }));
    for (const select of screen.getAllByRole("combobox")) {
      expect(select).toHaveValue("PRESENT");
    }
  });

  it("submits the current per-student statuses and shows a success message", async () => {
    mockedBulkMarkAction.mockResolvedValue({
      success: true,
      data: [
        { id: "a1", studentId: "student-1", academicSessionId: "session-1", classId: "class-1", sectionId: "section-1", date: new Date("2026-07-28"), status: "PRESENT", remarks: null, markedBy: null },
        { id: "a2", studentId: "student-2", academicSessionId: "session-1", classId: "class-1", sectionId: "section-1", date: new Date("2026-07-28"), status: "ABSENT", remarks: null, markedBy: null },
      ],
    });

    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /save attendance/i }));

    await waitFor(() => {
      expect(mockedBulkMarkAction).toHaveBeenCalledWith({
        academicSessionId: "session-1",
        classId: "class-1",
        sectionId: "section-1",
        date: "2026-07-28",
        entries: [
          { studentId: "student-1", status: "PRESENT" },
          { studentId: "student-2", status: "ABSENT" },
        ],
      });
    });

    expect(await screen.findByText(/attendance saved for 2 student\(s\)/i)).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the server error message and does not refresh on failure", async () => {
    mockedBulkMarkAction.mockResolvedValue({
      success: false,
      error: { code: "INVALID_CLASS", message: "Select a valid class for the chosen academic session." },
    });

    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /save attendance/i }));

    expect(await screen.findByText("Select a valid class for the chosen academic session.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
