import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { StudentDocumentList } from "./student-document-list";
import type { StudentDocumentListItemDTO } from "@/modules/students/application/dto/student-document.dto";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const deleteStudentDocumentActionMock = vi.fn();
const replaceStudentDocumentActionMock = vi.fn();
vi.mock("../../documents/actions", () => ({
  deleteStudentDocumentAction: (...args: unknown[]) => deleteStudentDocumentActionMock(...args),
  replaceStudentDocumentAction: (...args: unknown[]) => replaceStudentDocumentActionMock(...args),
  uploadStudentDocumentAction: vi.fn(),
}));

function makeDoc(overrides: Partial<StudentDocumentListItemDTO> = {}): StudentDocumentListItemDTO {
  return {
    id: "doc-1",
    studentId: "student-1",
    documentType: "BIRTH_CERTIFICATE",
    originalFileName: "birth-cert.pdf",
    mimeType: "application/pdf",
    fileSize: 2048,
    uploadedBy: "user-1",
    createdAt: new Date("2026-01-01"),
    signedUrl: "https://storage.example.com/signed/birth-cert.pdf",
    ...overrides,
  };
}

describe("StudentDocumentList", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    deleteStudentDocumentActionMock.mockReset();
    replaceStudentDocumentActionMock.mockReset();
  });

  it("shows an empty state when there are no non-PHOTO documents", () => {
    render(
      <StudentDocumentList studentId="student-1" documents={[]} canUpload canDelete />
    );
    expect(screen.getByText(/no documents uploaded yet/i)).toBeInTheDocument();
  });

  it("excludes PHOTO documents from the list", () => {
    render(
      <StudentDocumentList
        studentId="student-1"
        documents={[makeDoc({ documentType: "PHOTO", originalFileName: "photo.jpg" })]}
        canUpload
        canDelete
      />
    );
    expect(screen.getByText(/no documents uploaded yet/i)).toBeInTheDocument();
    expect(screen.queryByText("photo.jpg")).not.toBeInTheDocument();
  });

  it("renders a row per document with name, type, size, and date", () => {
    render(
      <StudentDocumentList studentId="student-1" documents={[makeDoc()]} canUpload canDelete />
    );
    expect(screen.getByText("birth-cert.pdf")).toBeInTheDocument();
    expect(screen.getByText("Birth Certificate")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
  });

  it("hides Replace/Delete actions when the caller lacks permission", () => {
    render(
      <StudentDocumentList
        studentId="student-1"
        documents={[makeDoc()]}
        canUpload={false}
        canDelete={false}
      />
    );
    expect(screen.queryByLabelText(/replace birth-cert.pdf/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/delete birth-cert.pdf/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/preview birth-cert.pdf/i)).toBeInTheDocument();
  });

  it("opens the preview dialog when Preview is clicked", async () => {
    render(
      <StudentDocumentList studentId="student-1" documents={[makeDoc()]} canUpload canDelete />
    );
    await userEvent.click(screen.getByLabelText(/preview birth-cert.pdf/i));
    expect(screen.getByRole("dialog", { name: /preview of birth-cert.pdf/i })).toBeInTheDocument();
  });

  it("opens the delete confirmation dialog and calls the delete action on confirm", async () => {
    deleteStudentDocumentActionMock.mockResolvedValue({ success: true, data: { documentId: "doc-1", deleted: true } });

    render(
      <StudentDocumentList studentId="student-1" documents={[makeDoc()]} canUpload canDelete />
    );
    await userEvent.click(screen.getByLabelText(/delete birth-cert.pdf/i));
    expect(screen.getByRole("dialog", { name: /delete document/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteStudentDocumentActionMock).toHaveBeenCalledWith({ documentId: "doc-1" });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("shows a row-level error and does not refresh when delete fails", async () => {
    deleteStudentDocumentActionMock.mockResolvedValue({
      success: false,
      error: { code: "DOCUMENT_NOT_FOUND", message: "Document not found." },
    });

    render(
      <StudentDocumentList studentId="student-1" documents={[makeDoc()]} canUpload canDelete />
    );
    await userEvent.click(screen.getByLabelText(/delete birth-cert.pdf/i));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText("Document not found.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
