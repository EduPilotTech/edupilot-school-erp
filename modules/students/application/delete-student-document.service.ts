import "server-only";
import { ValidationError } from "@/lib/errors";
import { STUDENT_DOCUMENTS_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaStudentDocumentRepository } from "../infrastructure/prisma-student-document.repository";
import { DocumentNotFoundError } from "../domain/errors";
import {
  deleteStudentDocumentSchema,
  type DeleteStudentDocumentResult,
} from "./dto/student-document.dto";

export interface DeleteStudentDocumentContext {
  tenantId: string;
}

// Sprint 4.8B. Soft-deletes the metadata row FIRST (the source of truth for "is this document
// gone" — once this commits, the document is correctly absent from every list/lookup), then
// attempts to delete the physical file. A storage-delete failure is reported (never swallowed
// silently) but does not fail the overall operation or roll back the soft-delete: the metadata
// is already consistent at that point (the document IS deleted, from the application's
// perspective), and only an orphaned blob would remain — a cleanup concern, not a correctness
// one, the same reasoning replace-student-document.service.ts applies to its old-file cleanup.
export async function deleteStudentDocument(
  input: unknown,
  context: DeleteStudentDocumentContext
): Promise<DeleteStudentDocumentResult> {
  const parsed = deleteStudentDocumentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid document id.");
  }
  const { documentId } = parsed.data;
  const { tenantId } = context;

  const documentRepository = new PrismaStudentDocumentRepository();

  const document = await documentRepository.findById(tenantId, documentId);
  if (!document || document.deletedAt !== null) {
    throw new DocumentNotFoundError();
  }

  await documentRepository.softDelete(tenantId, documentId);

  const storage = new SupabaseStorageService();
  await storage.delete(STUDENT_DOCUMENTS_BUCKET, document.storageKey).catch((error: unknown) => {
    console.error(
      `Failed to delete document's storage file (tenantId=${tenantId}, documentId=${documentId}, ` +
        `storageKey=${document.storageKey}):`,
      error
    );
  });

  return { documentId, deleted: true };
}
