import "server-only";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
} from "@/lib/document-validation";
import type { StudentDocumentEntity, DocumentTypeValue } from "../domain/student-document.entity";
import type { StudentDocumentDTO } from "./dto/student-document.dto";

// Shared by upload-student-document.service.ts and replace-student-document.service.ts —
// deliberately NOT in lib/document-validation.ts, which must not depend on a
// modules/students/domain type (see that file's own comment on the reverse-dependency this
// avoids). `PHOTO` only accepts image types; every certificate type accepts an image (a scan) or
// a PDF.
export function allowedMimeTypesForDocumentType(documentType: DocumentTypeValue): readonly string[] {
  return documentType === "PHOTO" ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_DOCUMENT_MIME_TYPES;
}

// `{tenantId}/{studentId}/{documentType}/{uuid}-{sanitizedFileName}` — tenant- and
// student-scoped folder structure (Performance requirement: tenant isolation extends to how
// files are organized in the bucket, not just DB rows), with a random prefix so two uploads of
// the same original filename never collide.
export function buildStorageKey(
  tenantId: string,
  studentId: string,
  documentType: DocumentTypeValue,
  originalFileName: string
): string {
  const sanitized = originalFileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${tenantId}/${studentId}/${documentType}/${crypto.randomUUID()}-${sanitized}`;
}

export function toDocumentDTO(entity: StudentDocumentEntity): StudentDocumentDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    documentType: entity.documentType,
    originalFileName: entity.originalFileName,
    mimeType: entity.mimeType,
    fileSize: entity.fileSize,
    uploadedBy: entity.uploadedBy,
    createdAt: entity.createdAt,
  };
}
