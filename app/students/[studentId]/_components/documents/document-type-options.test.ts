import { describe, expect, it } from "vitest";
import { allowedMimeTypesForDocumentType, formatFileSize } from "./document-type-options";
import { ALLOWED_DOCUMENT_MIME_TYPES, ALLOWED_IMAGE_MIME_TYPES } from "@/lib/document-validation";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("allowedMimeTypesForDocumentType", () => {
  it("restricts PHOTO to image types only", () => {
    expect(allowedMimeTypesForDocumentType("PHOTO")).toEqual(ALLOWED_IMAGE_MIME_TYPES);
  });

  it("allows images or PDF for every other document type", () => {
    expect(allowedMimeTypesForDocumentType("BIRTH_CERTIFICATE")).toEqual(ALLOWED_DOCUMENT_MIME_TYPES);
    expect(allowedMimeTypesForDocumentType("OTHER")).toEqual(ALLOWED_DOCUMENT_MIME_TYPES);
  });
});
