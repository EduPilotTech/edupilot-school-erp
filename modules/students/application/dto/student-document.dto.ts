import { z } from "zod";

// Sprint 4.8B. Mirrors DocumentTypeValue (modules/students/domain/student-document.entity.ts)
// as a Zod enum for validation — kept in sync manually, same approach GENDER_OPTIONS/
// admission-form.constants.ts already takes for Prisma-backed enums in a schema file that must
// not import generated Prisma types.
export const documentTypeSchema = z.enum([
  "BIRTH_CERTIFICATE",
  "TRANSFER_CERTIFICATE",
  "MEDICAL_CERTIFICATE",
  "CASTE_CERTIFICATE",
  "INCOME_CERTIFICATE",
  "AADHAAR",
  "PHOTO",
  "OTHER",
]);

// Validates only the file's METADATA — `file` (the actual binary payload) is not something Zod
// usefully validates across Buffer/Blob/File, so it travels alongside this schema's output as a
// sibling field, not through it. Every Upload/Replace service call re-runs this against its
// input for defense-in-depth (docs/CODING_STANDARDS.md §4), matching every other service in this
// codebase.
export const documentUploadMetaSchema = z.object({
  studentId: z.string().uuid("Invalid student id."),
  documentType: documentTypeSchema,
  originalFileName: z.string().trim().min(1, "File name is required."),
  mimeType: z.string().trim().min(1, "MIME type is required."),
  fileSize: z.number().int().positive("File size must be greater than zero."),
});

export type DocumentUploadMeta = z.infer<typeof documentUploadMetaSchema>;

export interface UploadStudentDocumentInput extends DocumentUploadMeta {
  file: Buffer | Blob | File;
}

export type ReplaceStudentDocumentInput = UploadStudentDocumentInput;

export const deleteStudentDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document id."),
});
export type DeleteStudentDocumentInput = z.infer<typeof deleteStudentDocumentSchema>;

export const listStudentDocumentsSchema = z.object({
  studentId: z.string().uuid("Invalid student id."),
});
export type ListStudentDocumentsInput = z.infer<typeof listStudentDocumentsSchema>;

// Deliberately does NOT expose `storageKey` — an internal storage detail, never a value any
// caller outside modules/students/infrastructure and lib/storage should see or persist
// elsewhere. Callers that need a usable link get one from ListStudentDocumentsService's
// `signedUrl`, generated on demand, not stored.
export interface StudentDocumentDTO {
  id: string;
  studentId: string;
  documentType: DocumentUploadMeta["documentType"];
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string | null;
  createdAt: Date;
}

export interface StudentDocumentListItemDTO extends StudentDocumentDTO {
  signedUrl: string;
}

export interface DeleteStudentDocumentResult {
  documentId: string;
  deleted: true;
}
