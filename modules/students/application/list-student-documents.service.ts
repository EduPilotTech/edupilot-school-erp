import "server-only";
import { ValidationError } from "@/lib/errors";
import { STUDENT_DOCUMENTS_BUCKET } from "@/lib/storage/buckets";
import { SupabaseStorageService } from "@/lib/storage/supabase-storage.service";
import { PrismaStudentRepository } from "../infrastructure/prisma-student.repository";
import { PrismaStudentDocumentRepository } from "../infrastructure/prisma-student-document.repository";
import { StudentNotFoundError } from "../domain/errors";
import {
  listStudentDocumentsSchema,
  type StudentDocumentListItemDTO,
} from "./dto/student-document.dto";
import { toDocumentDTO } from "./document-storage.helpers";

export interface ListStudentDocumentsContext {
  tenantId: string;
}

// Sprint 4.8B. Lists a student's active (non-soft-deleted) documents, sorted by document type,
// each with a freshly-generated signed URL. No caching layer exists for signed URLs (none was
// built in Sprint 4.8A, and this step doesn't introduce new infrastructure beyond what was
// authorized) — every call generates fresh ones. Signed-URL generation runs in parallel
// (Promise.all), not sequentially per document, per this sprint's "no duplicate queries/no
// unnecessary round trips" performance requirement.
export async function listStudentDocuments(
  input: unknown,
  context: ListStudentDocumentsContext
): Promise<StudentDocumentListItemDTO[]> {
  const parsed = listStudentDocumentsSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid student id.");
  }
  const { studentId } = parsed.data;
  const { tenantId } = context;

  const studentRepository = new PrismaStudentRepository();
  const documentRepository = new PrismaStudentDocumentRepository();

  const student = await studentRepository.findById(tenantId, studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const documents = await documentRepository.findByStudent(tenantId, studentId);
  const sorted = [...documents].sort((a, b) => a.documentType.localeCompare(b.documentType));

  const storage = new SupabaseStorageService();
  return Promise.all(
    sorted.map(async (document) => ({
      ...toDocumentDTO(document),
      signedUrl: await storage.signedUrl(STUDENT_DOCUMENTS_BUCKET, document.storageKey),
    }))
  );
}
