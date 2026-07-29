import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { StudentPhotoUploader } from "./student-photo-uploader";
import type { StudentDocumentListItemDTO } from "@/modules/students/application/dto/student-document.dto";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("../../documents/actions", () => ({
  uploadStudentDocumentAction: vi.fn(),
  replaceStudentDocumentAction: vi.fn(),
  deleteStudentDocumentAction: vi.fn(),
}));

function makePhoto(overrides: Partial<StudentDocumentListItemDTO> = {}): StudentDocumentListItemDTO {
  return {
    id: "photo-1",
    studentId: "student-1",
    documentType: "PHOTO",
    originalFileName: "photo.jpg",
    mimeType: "image/jpeg",
    fileSize: 1024,
    uploadedBy: "user-1",
    createdAt: new Date("2026-01-01"),
    signedUrl: "https://storage.example.com/signed/photo.jpg",
    ...overrides,
  };
}

describe("StudentPhotoUploader", () => {
  beforeEach(() => refreshMock.mockClear());

  it("shows initials when no photo exists", () => {
    render(
      <StudentPhotoUploader
        studentId="student-1"
        fullName="Jane Doe"
        photo={null}
        canUpload
        canDelete
      />
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("shows the photo image when one exists", () => {
    render(
      <StudentPhotoUploader
        studentId="student-1"
        fullName="Jane Doe"
        photo={makePhoto()}
        canUpload
        canDelete
      />
    );
    const img = screen.getByAltText("Jane Doe");
    expect(img).toHaveAttribute("src", "https://storage.example.com/signed/photo.jpg");
  });

  it("hides the upload button when canUpload is false", () => {
    render(
      <StudentPhotoUploader
        studentId="student-1"
        fullName="Jane Doe"
        photo={null}
        canUpload={false}
        canDelete
      />
    );
    expect(screen.queryByLabelText(/upload photo/i)).not.toBeInTheDocument();
  });

  it("hides the delete button when there is no photo, even if canDelete is true", () => {
    render(
      <StudentPhotoUploader
        studentId="student-1"
        fullName="Jane Doe"
        photo={null}
        canUpload
        canDelete
      />
    );
    expect(screen.queryByLabelText(/delete photo/i)).not.toBeInTheDocument();
  });

  it("shows both replace and delete controls when a photo exists and both permissions are granted", () => {
    render(
      <StudentPhotoUploader
        studentId="student-1"
        fullName="Jane Doe"
        photo={makePhoto()}
        canUpload
        canDelete
      />
    );
    expect(screen.getByLabelText(/replace photo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delete photo/i)).toBeInTheDocument();
  });
});
