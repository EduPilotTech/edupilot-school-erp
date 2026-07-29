import { ALLOWED_DOCUMENT_MIME_TYPES, ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/document-validation";

// Sprint 4.8C — client-side constants for the Document upload UI. Mirrors DocumentTypeValue
// (modules/students/domain/student-document.entity.ts) as a plain literal list rather than
// importing it — this file is bundled into Client Components, which must not import anything
// from modules/students/domain (a server-side dependency chain), the same reasoning
// admission-form.constants.ts already documents for GENDER_OPTIONS.
export const DOCUMENT_TYPE_OPTIONS = [
  { value: "BIRTH_CERTIFICATE", label: "Birth Certificate" },
  { value: "TRANSFER_CERTIFICATE", label: "Transfer Certificate" },
  { value: "MEDICAL_CERTIFICATE", label: "Medical Certificate" },
  { value: "CASTE_CERTIFICATE", label: "Caste Certificate" },
  { value: "INCOME_CERTIFICATE", label: "Income Certificate" },
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PHOTO", label: "Photo" },
  { value: "OTHER", label: "Other Document" },
] as const;

export type DocumentTypeOption = (typeof DOCUMENT_TYPE_OPTIONS)[number]["value"];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

// Document types selectable from the general "Add Document" upload flow — excludes PHOTO, which
// has its own dedicated StudentPhotoUploader (a student has at most one active PHOTO document,
// same "one active per type" rule enforced server-side, but the UI for it is a distinct,
// avatar-shaped widget, not a row in the general document list's upload queue).
export const CERTIFICATE_DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPE_OPTIONS.filter(
  (option) => option.value !== "PHOTO"
);

// Re-exported for the upload UI's client-side pre-validation (immediate feedback before
// attempting a Server Action call) — the service re-validates authoritatively regardless, per
// docs/CODING_STANDARDS.md §4's defense-in-depth convention.
export { ALLOWED_DOCUMENT_MIME_TYPES, ALLOWED_IMAGE_MIME_TYPES, MAX_FILE_SIZE_BYTES };

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function allowedMimeTypesForDocumentType(documentType: string): readonly string[] {
  return documentType === "PHOTO" ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_DOCUMENT_MIME_TYPES;
}
