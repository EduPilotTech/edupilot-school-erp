import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ExamTypeManager } from "./ExamTypeManager";
import {
  createExamTypeAction,
  updateExamTypeAction,
  deleteExamTypeAction,
} from "@/app/examinations/exam-types/actions";
import type { ExamTypeDTO } from "@/modules/examinations/application/dto/exam-type.dto";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/examinations/exam-types/actions", () => ({
  createExamTypeAction: vi.fn(),
  updateExamTypeAction: vi.fn(),
  deleteExamTypeAction: vi.fn(),
}));

const mockedCreate = vi.mocked(createExamTypeAction);
const mockedUpdate = vi.mocked(updateExamTypeAction);
const mockedDelete = vi.mocked(deleteExamTypeAction);

const EXAM_TYPES: ExamTypeDTO[] = [
  { id: "et1", name: "Mid Term", code: "MIDTERM", isActive: true },
];

describe("ExamTypeManager", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    mockedCreate.mockReset();
    mockedUpdate.mockReset();
    mockedDelete.mockReset();
  });

  it("hides the create form and row actions when canManage is false", () => {
    render(<ExamTypeManager items={EXAM_TYPES} canManage={false} />);
    expect(screen.queryByPlaceholderText("Mid Term")).not.toBeInTheDocument();
    expect(screen.queryByText("Deactivate")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when there are no exam types", () => {
    render(<ExamTypeManager items={[]} canManage />);
    expect(screen.getByText(/no exam types yet/i)).toBeInTheDocument();
  });

  it("creates an exam type and refreshes on success", async () => {
    mockedCreate.mockResolvedValue({
      success: true,
      data: { id: "et2", name: "Final Term", code: "FINAL", isActive: true },
    });

    render(<ExamTypeManager items={EXAM_TYPES} canManage />);
    fireEvent.change(screen.getByPlaceholderText("Mid Term"), { target: { value: "Final Term" } });
    fireEvent.change(screen.getByPlaceholderText("MIDTERM"), { target: { value: "FINAL" } });
    fireEvent.click(screen.getByRole("button", { name: /add exam type/i }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({ name: "Final Term", code: "FINAL" });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the server error message on create failure and does not refresh", async () => {
    mockedCreate.mockResolvedValue({
      success: false,
      error: { code: "EXAM_TYPE_ALREADY_EXISTS", message: "An exam type with this code already exists." },
    });

    render(<ExamTypeManager items={EXAM_TYPES} canManage />);
    fireEvent.change(screen.getByPlaceholderText("Mid Term"), { target: { value: "Final Term" } });
    fireEvent.change(screen.getByPlaceholderText("MIDTERM"), { target: { value: "MIDTERM" } });
    fireEvent.click(screen.getByRole("button", { name: /add exam type/i }));

    expect(await screen.findByText("An exam type with this code already exists.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("toggles an exam type's active state", async () => {
    mockedUpdate.mockResolvedValue({ success: true, data: { ...EXAM_TYPES[0], isActive: false } });

    render(<ExamTypeManager items={EXAM_TYPES} canManage />);
    fireEvent.click(screen.getByRole("button", { name: /deactivate/i }));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith("et1", { isActive: false });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("deletes an exam type", async () => {
    mockedDelete.mockResolvedValue({ success: true, data: null });

    render(<ExamTypeManager items={EXAM_TYPES} canManage />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith("et1");
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
