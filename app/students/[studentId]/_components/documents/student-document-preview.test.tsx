import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StudentDocumentPreview } from "./student-document-preview";
import type { StudentDocumentListItemDTO } from "@/modules/students/application/dto/student-document.dto";

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

describe("StudentDocumentPreview", () => {
  it("renders an <img> for image mime types", () => {
    render(
      <StudentDocumentPreview
        document={makeDoc({ mimeType: "image/jpeg", originalFileName: "photo.jpg" })}
        onClose={vi.fn()}
      />
    );
    const img = screen.getByAltText("photo.jpg");
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "https://storage.example.com/signed/birth-cert.pdf");
  });

  it("renders an <iframe> for application/pdf", () => {
    const { container } = render(
      <StudentDocumentPreview document={makeDoc()} onClose={vi.fn()} />
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveAttribute("src", "https://storage.example.com/signed/birth-cert.pdf");
  });

  it("shows a fallback message for unsupported preview types", () => {
    render(
      <StudentDocumentPreview
        document={makeDoc({ mimeType: "application/zip", originalFileName: "archive.zip" })}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/no inline preview available/i)).toBeInTheDocument();
  });

  it("the Download link points at the signed URL", () => {
    render(<StudentDocumentPreview document={makeDoc()} onClose={vi.fn()} />);
    const link = screen.getByRole("link", { name: /download/i });
    expect(link).toHaveAttribute("href", "https://storage.example.com/signed/birth-cert.pdf");
    expect(link).toHaveAttribute("download", "birth-cert.pdf");
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(<StudentDocumentPreview document={makeDoc()} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /close preview/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape key", async () => {
    const onClose = vi.fn();
    render(<StudentDocumentPreview document={makeDoc()} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
