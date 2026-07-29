import "server-only";
import { ValidationError, BusinessRuleError } from "@/lib/errors";
import { MAX_FILE_SIZE_BYTES } from "@/lib/document-validation";
import { STUDENT_DOCUMENTS_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaStudentRepository } from "../infrastructure/prisma-student.repository";
import { PrismaStudentDocumentRepository } from "../infrastructure/prisma-student-document.repository";
import { StudentNotFoundError, DocumentTooLargeError, UnsupportedFileTypeError } from "../domain/errors";
import {
  documentUploadMetaSchema,
  type StudentDocumentDTO,
  type UploadStudentDocumentInput,
} from "./dto/student-document.dto";
import { allowedMimeTypesForDocumentType, buildStorageKey, toDocumentDTO } from "./document-storage.helpers";

export interface UploadStudentDocumentContext {
  tenantId: string;
  actingUserId: string;
}

// Sprint 4.8B. Storage and Postgres are two different systems with no shared transaction, so
// atomicity here is sequencing + a compensating action, not a database transaction (see this
// sprint's Transaction Flow): upload the file first, then create the metadata row; if the row
// creation fails, delete the now-orphaned file rather than leaving a file with no matching
// StudentDocument.
export async function uploadStudentDocument(
  input: UploadStudentDocumentInput,
  context: UploadStudentDocumentContext
): Promise<StudentDocumentDTO> {
  const parsed = documentUploadMetaSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid document upload data.");
  }
  const meta = parsed.data;

  const { tenantId, actingUserId } = context;

  const studentRepository = new PrismaStudentRepository();
  const documentRepository = new PrismaStudentDocumentRepository();

  const student = await studentRepository.findById(tenantId, meta.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const allowedTypes = allowedMimeTypesForDocumentType(meta.documentType);
  if (!allowedTypes.includes(meta.mimeType)) {
    throw new UnsupportedFileTypeError(
      `${meta.mimeType} is not an accepted file type for ${meta.documentType}.`
    );
  }
  if (meta.fileSize > MAX_FILE_SIZE_BYTES) {
    throw new DocumentTooLargeError();
  }

  // Duplicate rule: at most one ACTIVE document per (student, documentType) — applies uniformly
  // to PHOTO and every certificate type. Soft-deleted rows of the same type don't count
  // (findByStudent already excludes them), so re-uploading after a delete is allowed; updating
  // an existing active one requires Replace, not Upload.
  const existingDocuments = await documentRepository.findByStudent(tenantId, meta.studentId);
  const hasActiveOfType = existingDocuments.some((doc) => doc.documentType === meta.documentType);
  if (hasActiveOfType) {
    throw new BusinessRuleError(
      `A ${meta.documentType} document already exists for this student. Use replace instead.`
    );
  }

  const storageKey = buildStorageKey(tenantId, meta.studentId, meta.documentType, meta.originalFileName);
  const storage = new SupabaseStorageService();

  await storage.upload({
    bucket: STUDENT_DOCUMENTS_BUCKET,
    key: storageKey,
    file: input.file,
    contentType: meta.mimeType,
  });

  try {
    const document = await documentRepository.create({
      tenantId,
      studentId: meta.studentId,
      documentType: meta.documentType,
      originalFileName: meta.originalFileName,
      storageKey,
      mimeType: meta.mimeType,
      fileSize: meta.fileSize,
      uploadedBy: actingUserId,
    });
    return toDocumentDTO(document);
  } catch (error) {
    // Compensate: the file exists in storage but has no metadata row — delete it rather than
    // leave an orphan. Best-effort — a failure here must not mask the original error, which is
    // what the caller actually needs to see.
    await storage.delete(STUDENT_DOCUMENTS_BUCKET, storageKey).catch(() => {});
    throw error;
  }
}
