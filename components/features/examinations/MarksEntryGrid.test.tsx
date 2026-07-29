import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MarksEntryGrid, type MarksEntryRow } from "./MarksEntryGrid";
import { bulkEnterMarksAction } from "@/app/examinations/marks/actions";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/examinations/marks/actions", () => ({
  bulkEnterMarksAction: vi.fn(),
}));

const mockedBulkEnterMarks = vi.mocked(bulkEnterMarksAction);

const ROWS: MarksEntryRow[] = [
  { studentId: "student-1", admissionNumber: "A-001", fullName: "Alice Tester", marksObtained: null, isAbsent: false },
  { studentId: "student-2", admissionNumber: "A-002", fullName: "Bob Tester", marksObtained: 45, isAbsent: false },
];

function renderGrid(rows: MarksEntryRow[] = ROWS) {
  return render(
    <MarksEntryGrid examSubjectId="exam-subject-1" maxMarks={100} passingMarks={33} rows={rows} />
  );
}

describe("MarksEntryGrid", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    mockedBulkEnterMarks.mockReset();
  });

  it("shows a message instead of a table when there are no students", () => {
    renderGrid([]);
    expect(screen.getByText(/no students found/i)).toBeInTheDocument();
  });

  it("pre-fills each row's draft from its already-saved mark", () => {
    renderGrid();
    const marksInputs = screen.getAllByRole("spinbutton");
    expect(marksInputs[0]).toHaveValue(null);
    expect(marksInputs[1]).toHaveValue(45);
  });

  it("disables the marks input and submits without a mark when a student is checked absent", async () => {
    mockedBulkEnterMarks.mockResolvedValue({ success: true, data: [] });

    renderGrid();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    const marksInputs = screen.getAllByRole("spinbutton");
    expect(marksInputs[0]).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /save marks/i }));

    await waitFor(() => {
      expect(mockedBulkEnterMarks).toHaveBeenCalledWith({
        examSubjectId: "exam-subject-1",
        entries: [
          { studentId: "student-1", isAbsent: true, marksObtained: undefined },
          { studentId: "student-2", isAbsent: false, marksObtained: 45 },
        ],
      });
    });
  });

  it("submits entered marks and shows a success message", async () => {
    mockedBulkEnterMarks.mockResolvedValue({
      success: true,
      data: [
        { id: "m1", examSubjectId: "exam-subject-1", studentId: "student-1", marksObtained: 80, isAbsent: false, remarks: null },
        { id: "m2", examSubjectId: "exam-subject-1", studentId: "student-2", marksObtained: 45, isAbsent: false, remarks: null },
      ],
    });

    renderGrid();
    const marksInputs = screen.getAllByRole("spinbutton");
    fireEvent.change(marksInputs[0], { target: { value: "80" } });
    fireEvent.click(screen.getByRole("button", { name: /save marks/i }));

    await waitFor(() => {
      expect(mockedBulkEnterMarks).toHaveBeenCalledWith({
        examSubjectId: "exam-subject-1",
        entries: [
          { studentId: "student-1", isAbsent: false, marksObtained: 80 },
          { studentId: "student-2", isAbsent: false, marksObtained: 45 },
        ],
      });
    });

    expect(await screen.findByText(/marks saved for 2 student\(s\)/i)).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the server error message and does not refresh on failure", async () => {
    mockedBulkEnterMarks.mockResolvedValue({
      success: false,
      error: { code: "INVALID_MARKS", message: "Marks obtained cannot exceed max marks." },
    });

    renderGrid();
    fireEvent.click(screen.getByRole("button", { name: /save marks/i }));

    expect(await screen.findByText("Marks obtained cannot exceed max marks.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
