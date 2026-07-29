// Sprint 4.8A — centralized file-validation constants. Not used by any service yet this step
// (no Application Services/Server Actions are built in 4.8A) — this exists so Sprint 4.8B's
// upload service has one place to import limits from, rather than each call site re-declaring
// its own. Deliberately lives in `lib/`, not `modules/students/`: these are generic file-upload
// limits, not specific to the Student domain, and a `lib/` file must not depend on a
// `modules/*/domain` type (the reverse dependency direction this codebase uses everywhere else).
//
// Matches the 5 MB cap components/features/students/admission-form.schema.ts already uses for
// the same categories of files (its own comment calls that a "UI-side cap; real limits belong to
// the future upload implementation" — this is that future implementation).
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ALLOWED_PDF_MIME_TYPES = ["application/pdf"] as const;

// Non-photo documents (certificates) may be a scanned image or a PDF.
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_PDF_MIME_TYPES,
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type AllowedDocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];
