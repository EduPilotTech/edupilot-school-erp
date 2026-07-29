// Sprint 4.8A — Student Document Infrastructure. `PHOTO` is one of the document types, not a
// separate concept — see prisma/schema.prisma's DocumentType comment.
export type DocumentTypeValue =
  | "BIRTH_CERTIFICATE"
  | "TRANSFER_CERTIFICATE"
  | "MEDICAL_CERTIFICATE"
  | "CASTE_CERTIFICATE"
  | "INCOME_CERTIFICATE"
  | "AADHAAR"
  | "PHOTO"
  | "OTHER";

// Domain view of StudentDocument, decoupled from Prisma's generated type. `storageKey` is the
// provider-agnostic identifier persisted here — resolving it to an actual downloadable/signed
// URL is StorageService's job (lib/storage/), not this entity's or the repository's.
export interface StudentDocumentEntity {
  id: string;
  tenantId: string;
  studentId: string;
  documentType: DocumentTypeValue;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  uploadedBy: string | null;
}
