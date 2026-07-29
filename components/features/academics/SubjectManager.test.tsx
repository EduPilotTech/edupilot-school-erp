import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SubjectManager } from "./SubjectManager";
import { createSubjectAction, updateSubjectAction, deleteSubjectAction } from "@/app/academics/subjects/actions";
import type { SubjectDTO } from "@/modules/academics/application/dto/subject.dto";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/academics/subjects/actions", () => ({
  createSubjectAction: vi.fn(),
  updateSubjectAction: vi.fn(),
  deleteSubjectAction: vi.fn(),
}));

const mockedCreate = vi.mocked(createSubjectAction);
const mockedUpdate = vi.mocked(updateSubjectAction);
const mockedDelete = vi.mocked(deleteSubjectAction);

const SUBJECTS: SubjectDTO[] = [
  { id: "s1", schoolId: "school-1", name: "Mathematics", code: "MATH", isActive: true },
];

describe("SubjectManager", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    mockedCreate.mockReset();
    mockedUpdate.mockReset();
    mockedDelete.mockReset();
  });

  it("hides the create form and row actions when canManage is false", () => {
    render(<SubjectManager items={SUBJECTS} canManage={false} />);
    expect(screen.queryByPlaceholderText("Mathematics")).not.toBeInTheDocument();
    expect(screen.queryByText("Deactivate")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when there are no subjects", () => {
    render(<SubjectManager items={[]} canManage />);
    expect(screen.getByText(/no subjects yet/i)).toBeInTheDocument();
  });

  it("creates a subject and refreshes on success", async () => {
    mockedCreate.mockResolvedValue({
      success: true,
      data: { id: "s2", schoolId: "school-1", name: "Science", code: "SCI", isActive: true },
    });

    render(<SubjectManager items={SUBJECTS} canManage />);
    fireEvent.change(screen.getByPlaceholderText("Mathematics"), { target: { value: "Science" } });
    fireEvent.change(screen.getByPlaceholderText("MATH"), { target: { value: "SCI" } });
    fireEvent.click(screen.getByRole("button", { name: /add subject/i }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({ name: "Science", code: "SCI" });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the server error message on create failure and does not refresh", async () => {
    mockedCreate.mockResolvedValue({
      success: false,
      error: { code: "SUBJECT_ALREADY_EXISTS", message: "A subject with this code already exists." },
    });

    render(<SubjectManager items={SUBJECTS} canManage />);
    fireEvent.change(screen.getByPlaceholderText("Mathematics"), { target: { value: "Science" } });
    fireEvent.change(screen.getByPlaceholderText("MATH"), { target: { value: "MATH" } });
    fireEvent.click(screen.getByRole("button", { name: /add subject/i }));

    expect(await screen.findByText("A subject with this code already exists.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("toggles a subject's active state", async () => {
    mockedUpdate.mockResolvedValue({ success: true, data: { ...SUBJECTS[0], isActive: false } });

    render(<SubjectManager items={SUBJECTS} canManage />);
    fireEvent.click(screen.getByRole("button", { name: /deactivate/i }));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith("s1", { isActive: false });
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("deletes a subject", async () => {
    mockedDelete.mockResolvedValue({ success: true, data: null });

    render(<SubjectManager items={SUBJECTS} canManage />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith("s1");
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
