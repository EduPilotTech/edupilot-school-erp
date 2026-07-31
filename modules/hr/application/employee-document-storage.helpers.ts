import "server-only";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
} from "@/lib/document-validation";
import type { EmployeeDocumentEntity, EmployeeDocumentTypeValue } from "../domain/employee-document.entity";
import type { EmployeeDocumentDTO } from "./dto/employee-document.dto";

// Shared by upload-employee-document.service.ts and generate-employee-letter.service.ts —
// mirrors modules/students/application/document-storage.helpers.ts's exact reasoning. `PHOTO`
// only accepts image types; every other uploadable document accepts an image (a scan) or a PDF.
export function allowedMimeTypesForEmployeeDocumentType(documentType: EmployeeDocumentTypeValue): readonly string[] {
  return documentType === "PHOTO" ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_DOCUMENT_MIME_TYPES;
}

// `{tenantId}/{employeeId}/{documentType}/{uuid}-{sanitizedFileName}` — tenant- and
// employee-scoped folder structure, mirroring buildStorageKey's own precedent.
export function buildEmployeeDocumentStorageKey(
  tenantId: string,
  employeeId: string,
  documentType: EmployeeDocumentTypeValue,
  originalFileName: string
): string {
  const sanitized = originalFileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${tenantId}/${employeeId}/${documentType}/${crypto.randomUUID()}-${sanitized}`;
}

export function toEmployeeDocumentDTO(entity: EmployeeDocumentEntity): EmployeeDocumentDTO {
  return {
    id: entity.id,
    employeeId: entity.employeeId,
    documentType: entity.documentType,
    originalFileName: entity.originalFileName,
    mimeType: entity.mimeType,
    fileSize: entity.fileSize,
    issuedDate: entity.issuedDate,
    createdAt: entity.createdAt,
  };
}
