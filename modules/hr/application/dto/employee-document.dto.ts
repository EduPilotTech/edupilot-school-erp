import { z } from "zod";
import type { EmployeeDocumentTypeValue } from "../../domain/employee-document.entity";

// The uploaded-file subset of EmployeeDocumentType — everything a user attaches as a file.
export const uploadableEmployeeDocumentTypeSchema = z.enum([
  "PHOTO",
  "RESUME",
  "IDENTITY_PROOF",
  "BANK_PROOF",
  "MEDICAL_CERTIFICATE",
  "POLICE_VERIFICATION",
  "OTHER",
]);
export type UploadableEmployeeDocumentType = z.infer<typeof uploadableEmployeeDocumentTypeSchema>;

// The system-generated letter/certificate subset of EmployeeDocumentType.
export const employeeLetterDocumentTypeSchema = z.enum([
  "APPOINTMENT_LETTER",
  "JOINING_LETTER",
  "PROMOTION_LETTER",
  "WARNING_LETTER",
  "EXPERIENCE_CERTIFICATE",
  "RELIEVING_LETTER",
]);
export type EmployeeLetterDocumentType = z.infer<typeof employeeLetterDocumentTypeSchema>;

// Validates only the file's METADATA — the binary payload travels alongside this schema's
// output as a sibling field, mirroring documentUploadMetaSchema's own precedent
// (modules/students/application/dto/student-document.dto.ts).
export const employeeDocumentUploadMetaSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id."),
  documentType: uploadableEmployeeDocumentTypeSchema,
  originalFileName: z.string().trim().min(1, "File name is required."),
  mimeType: z.string().trim().min(1, "MIME type is required."),
  fileSize: z.number().int().positive("File size must be greater than zero."),
});
export type EmployeeDocumentUploadMeta = z.infer<typeof employeeDocumentUploadMetaSchema>;

export interface UploadEmployeeDocumentInput extends EmployeeDocumentUploadMeta {
  file: Buffer | Blob | File;
}

export const deleteEmployeeDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document id."),
});
export type DeleteEmployeeDocumentInput = z.infer<typeof deleteEmployeeDocumentSchema>;

export const listEmployeeDocumentsSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id."),
});
export type ListEmployeeDocumentsInput = z.infer<typeof listEmployeeDocumentsSchema>;

export const generateEmployeeLetterSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id."),
  documentType: employeeLetterDocumentTypeSchema,
  // Printed on the letter as its "effective from"/"issued on" date — defaults to today at the
  // service layer when omitted. Used by Promotion/Warning letters for the effective date.
  effectiveDate: z.coerce.date().optional(),
  // Experience Certificate / Relieving Letter only — the employment end date; omitted means
  // "employed to present" for an Experience Certificate.
  relievingDate: z.coerce.date().optional(),
  // Promotion Letter only — the new designation name to print in the body.
  newDesignationName: z.string().trim().max(200).optional(),
  // Warning Letter only (the cited reason) — general free-text remarks for any letter type.
  remarks: z.string().trim().max(1000).optional(),
});
export type GenerateEmployeeLetterServiceInput = z.infer<typeof generateEmployeeLetterSchema>;

// Deliberately does NOT expose `storageKey` — an internal storage detail, mirroring
// StudentDocumentDTO's own precedent.
export interface EmployeeDocumentDTO {
  id: string;
  employeeId: string;
  documentType: EmployeeDocumentTypeValue;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  issuedDate: Date | null;
  createdAt: Date;
}

export interface EmployeeDocumentListItemDTO extends EmployeeDocumentDTO {
  signedUrl: string;
}

export interface DeleteEmployeeDocumentResult {
  documentId: string;
  deleted: true;
}
