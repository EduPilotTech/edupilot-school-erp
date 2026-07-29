import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentsTabContent } from "./documents-tab-content";
import type { StudentDocumentListItemDTO } from "@/modules/students/application/dto/student-document.dto";

// Integration-style test: renders the full composition (Photo widget + Upload queue + Document
// list) the way app/students/[studentId]/page.tsx actually uses it, verifying the pieces wire
// together correctly rather than testing each in isolation again.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../documents/actions", () => ({
  uploadStudentDocumentAction: vi.fn(),
  replaceStudentDocumentAction: vi.fn(),
  deleteStudentDocumentAction: vi.fn(),
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

describe("DocumentsTabContent (integration)", () => {
  it("renders the Photo card, Upload card, and Documents list together", () => {
    render(
      <DocumentsTabContent
        studentId="student-1"
        fullName="Jane Doe"
        documents={[
          makeDoc(),
          makeDoc({
            id: "photo-1",
            documentType: "PHOTO",
            originalFileName: "photo.jpg",
            signedUrl: "https://storage.example.com/signed/photo.jpg",
          }),
        ]}
        canUploadDocuments
        canUploadPhoto
        canDelete
      />
    );

    expect(screen.getByText("Photo")).toBeInTheDocument();
    expect(screen.getByText("Upload Document")).toBeInTheDocument();
    expect(screen.getAllByText("Documents").length).toBeGreaterThan(0);

    // The PHOTO document feeds the Photo widget (real <img>), not a row in the document list.
    expect(screen.getByAltText("Jane Doe")).toHaveAttribute(
      "src",
      "https://storage.example.com/signed/photo.jpg"
    );
    expect(screen.getByText("birth-cert.pdf")).toBeInTheDocument();
  });

  it("hides the Upload Document card entirely when the caller cannot upload documents", () => {
    render(
      <DocumentsTabContent
        studentId="student-1"
        fullName="Jane Doe"
        documents={[]}
        canUploadDocuments={false}
        canUploadPhoto={false}
        canDelete={false}
      />
    );
    expect(screen.queryByText("Upload Document")).not.toBeInTheDocument();
  });
});
