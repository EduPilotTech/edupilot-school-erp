import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { MAX_FILE_SIZE_BYTES } from "@/lib/document-validation";
import { STUDENT_DOCUMENTS_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaStudentRepository } from "../infrastructure/prisma-student.repository";
import { PrismaStudentDocumentRepository } from "../infrastructure/prisma-student-document.repository";
import { DocumentNotFoundError, DocumentTooLargeError, StudentNotFoundError, UnsupportedFileTypeError } from "../domain/errors";
import {
  documentUploadMetaSchema,
  type ReplaceStudentDocumentInput,
  type StudentDocumentDTO,
} from "./dto/student-document.dto";
import { allowedMimeTypesForDocumentType, buildStorageKey, toDocumentDTO } from "./document-storage.helpers";

export interface ReplaceStudentDocumentContext {
  tenantId: string;
  actingUserId: string;
}

// Sprint 4.8B. Replaces the current active document of a given (student, documentType) — e.g.
// "the" photo, or "the" birth certificate — with a newly-uploaded file.
//
// Sequencing (per this sprint's Transaction Flow):
//   1. Upload the NEW file to storage first (outside any DB transaction — storage has no
//      transaction to join).
//   2. In ONE Postgres transaction: create the new StudentDocument row and soft-delete the old
//      one, atomically — passing the same `tx` to both repository calls (the optional-tx
//      pattern from Sprint 4 — Step 4, now threaded onto StudentDocumentRepository).
//   3. If that transaction fails, delete the newly-uploaded file (compensate) and rethrow — the
//      old document/file are untouched, so the student is left exactly as they were before this
//      call, not in a half-replaced state.
//   4. Only AFTER the transaction commits, delete the OLD file from storage. If this final
//      cleanup fails, it's reported (not swallowed) but does not fail the overall operation —
//      the database is already consistent (new doc active, old doc soft-deleted); only an
//      orphaned blob remains, a cleanup concern, not a correctness one.
export async function replaceStudentDocument(
  input: ReplaceStudentDocumentInput,
  context: ReplaceStudentDocumentContext
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

  const existingDocuments = await documentRepository.findByStudent(tenantId, meta.studentId);
  const current = existingDocuments.find((doc) => doc.documentType === meta.documentType);
  if (!current) {
    throw new DocumentNotFoundError(
      `No existing ${meta.documentType} document to replace — use upload instead.`
    );
  }

  const newStorageKey = buildStorageKey(tenantId, meta.studentId, meta.documentType, meta.originalFileName);
  const storage = new SupabaseStorageService();

  await storage.upload({
    bucket: STUDENT_DOCUMENTS_BUCKET,
    key: newStorageKey,
    file: input.file,
    contentType: meta.mimeType,
  });

  let newDocument: StudentDocumentDTO;
  try {
    newDocument = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      const created = await documentRepository.create(
        {
          tenantId,
          studentId: meta.studentId,
          documentType: meta.documentType,
          originalFileName: meta.originalFileName,
          storageKey: newStorageKey,
          mimeType: meta.mimeType,
          fileSize: meta.fileSize,
          uploadedBy: actingUserId,
        },
        tx
      );

      await documentRepository.softDelete(tenantId, current.id, tx);

      return toDocumentDTO(created);
    });
  } catch (error) {
    // Transaction rolled back — the old document/file are untouched. Compensate by deleting the
    // newly-uploaded file, which now has no matching row, rather than leaving it orphaned.
    await storage.delete(STUDENT_DOCUMENTS_BUCKET, newStorageKey).catch(() => {});
    throw error;
  }

  // Metadata is already consistent at this point — only cleanup of the old physical file
  // remains. A failure here is reported, not thrown, so it can never look like the replace
  // itself failed.
  await storage.delete(STUDENT_DOCUMENTS_BUCKET, current.storageKey).catch((cleanupError: unknown) => {
    console.error(
      `Failed to delete replaced document's old storage file (tenantId=${tenantId}, ` +
        `documentId=${current.id}, storageKey=${current.storageKey}):`,
      cleanupError
    );
  });

  return newDocument;
}
