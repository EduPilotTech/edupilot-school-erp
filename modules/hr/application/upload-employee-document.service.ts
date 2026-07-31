import "server-only";
import { ValidationError, BusinessRuleError } from "@/lib/errors";
import { MAX_FILE_SIZE_BYTES } from "@/lib/document-validation";
import { EMPLOYEE_DOCUMENTS_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaEmployeeDocumentRepository } from "../infrastructure/prisma-employee-document.repository";
import { EmployeeNotFoundError, DocumentTooLargeError, UnsupportedFileTypeError } from "../domain/errors";
import {
  employeeDocumentUploadMetaSchema,
  type EmployeeDocumentDTO,
  type UploadEmployeeDocumentInput,
} from "./dto/employee-document.dto";
import { allowedMimeTypesForEmployeeDocumentType, buildEmployeeDocumentStorageKey, toEmployeeDocumentDTO } from "./employee-document-storage.helpers";
import type { HrContext } from "./hr-context";

// Mirrors modules/students/application/upload-student-document.service.ts exactly: Storage and
// Postgres share no transaction, so atomicity here is sequencing + a compensating action — upload
// the file first, then create the metadata row; if the row creation fails, delete the
// now-orphaned file rather than leaving a file with no matching EmployeeDocument.
export async function uploadEmployeeDocument(input: UploadEmployeeDocumentInput, context: HrContext): Promise<EmployeeDocumentDTO> {
  const parsed = employeeDocumentUploadMetaSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid document upload data.");
  }
  const meta = parsed.data;
  const { tenantId, actingUserId } = context;

  const employeeRepository = new PrismaEmployeeRepository();
  const documentRepository = new PrismaEmployeeDocumentRepository();

  const employee = await employeeRepository.findById(tenantId, meta.employeeId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  const allowedTypes = allowedMimeTypesForEmployeeDocumentType(meta.documentType);
  if (!allowedTypes.includes(meta.mimeType)) {
    throw new UnsupportedFileTypeError(`${meta.mimeType} is not an accepted file type for ${meta.documentType}.`);
  }
  if (meta.fileSize > MAX_FILE_SIZE_BYTES) {
    throw new DocumentTooLargeError();
  }

  // Duplicate rule: at most one ACTIVE document per (employee, documentType) for the
  // single-instance types (PHOTO, RESUME, ...) — `OTHER` is exempt since it's a catch-all bucket
  // that may legitimately hold several files.
  if (meta.documentType !== "OTHER") {
    const existingDocuments = await documentRepository.findByEmployee(tenantId, meta.employeeId);
    const hasActiveOfType = existingDocuments.some((doc) => doc.documentType === meta.documentType);
    if (hasActiveOfType) {
      throw new BusinessRuleError(`A ${meta.documentType} document already exists for this employee. Delete it first to replace it.`);
    }
  }

  const storageKey = buildEmployeeDocumentStorageKey(tenantId, meta.employeeId, meta.documentType, meta.originalFileName);
  const storage = new SupabaseStorageService();

  await storage.upload({
    bucket: EMPLOYEE_DOCUMENTS_BUCKET,
    key: storageKey,
    file: input.file,
    contentType: meta.mimeType,
  });

  try {
    const document = await documentRepository.create({
      tenantId,
      employeeId: meta.employeeId,
      documentType: meta.documentType,
      originalFileName: meta.originalFileName,
      storageKey,
      mimeType: meta.mimeType,
      fileSize: meta.fileSize,
      createdBy: actingUserId,
    });
    return toEmployeeDocumentDTO(document);
  } catch (error) {
    // Compensate: the file exists in storage but has no metadata row — delete it rather than
    // leave an orphan. Best-effort — a failure here must not mask the original error.
    await storage.delete(EMPLOYEE_DOCUMENTS_BUCKET, storageKey).catch(() => {});
    throw error;
  }
}
