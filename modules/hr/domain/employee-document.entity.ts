// Phase 13 — mirrors StudentDocumentEntity's exact shape. Covers both uploaded documents
// (Photo, Resume, Identity Proof, Bank Proof, Medical Certificate, Police Verification) and
// system-generated letters (Appointment/Joining/Promotion/Warning Letter, Experience
// Certificate, Relieving Letter) in the same `documentType` vocabulary — see
// prisma/schema.prisma's EmployeeDocumentType comment.
export type EmployeeDocumentTypeValue =
  | "PHOTO"
  | "RESUME"
  | "IDENTITY_PROOF"
  | "BANK_PROOF"
  | "MEDICAL_CERTIFICATE"
  | "POLICE_VERIFICATION"
  | "APPOINTMENT_LETTER"
  | "JOINING_LETTER"
  | "PROMOTION_LETTER"
  | "WARNING_LETTER"
  | "EXPERIENCE_CERTIFICATE"
  | "RELIEVING_LETTER"
  | "OTHER";

export interface EmployeeDocumentEntity {
  id: string;
  tenantId: string;
  employeeId: string;
  documentType: EmployeeDocumentTypeValue;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  // Set only for a system-generated letter/certificate — the date printed on the document.
  issuedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
}
