import "server-only";
import { ValidationError } from "@/lib/errors";
import { EMPLOYEE_DOCUMENTS_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaEmployeeDocumentRepository } from "../infrastructure/prisma-employee-document.repository";
import { EmployeeDocumentNotFoundError } from "../domain/errors";
import { deleteEmployeeDocumentSchema, type DeleteEmployeeDocumentResult } from "./dto/employee-document.dto";

export interface DeleteEmployeeDocumentContext {
  tenantId: string;
}

// Mirrors modules/students/application/delete-student-document.service.ts's exact shape: soft-
// deletes the metadata row FIRST (the source of truth), then attempts to delete the physical
// file. A storage-delete failure is reported (never swallowed silently) but does not fail the
// overall operation or roll back the soft-delete.
export async function deleteEmployeeDocument(input: unknown, context: DeleteEmployeeDocumentContext): Promise<DeleteEmployeeDocumentResult> {
  const parsed = deleteEmployeeDocumentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid document id.");
  }
  const { documentId } = parsed.data;
  const { tenantId } = context;

  const documentRepository = new PrismaEmployeeDocumentRepository();

  const document = await documentRepository.findById(tenantId, documentId);
  if (!document || document.deletedAt !== null) {
    throw new EmployeeDocumentNotFoundError();
  }

  await documentRepository.softDelete(tenantId, documentId);

  const storage = new SupabaseStorageService();
  await storage.delete(EMPLOYEE_DOCUMENTS_BUCKET, document.storageKey).catch((error: unknown) => {
    console.error(
      `Failed to delete employee document's storage file (tenantId=${tenantId}, documentId=${documentId}, ` +
        `storageKey=${document.storageKey}):`,
      error
    );
  });

  return { documentId, deleted: true };
}
