import type { Prisma } from "@/lib/generated/prisma/client";
import type { DocumentTypeValue, StudentDocumentEntity } from "./student-document.entity";

export interface CreateStudentDocumentInput {
  tenantId: string;
  studentId: string;
  documentType: DocumentTypeValue;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string | null;
}

// Sprint 4.8A — infrastructure only. Deliberately no `update`/`restore` method: a document is
// immutable once uploaded (matching Enrollment's "create + close, never edit" design) — a future
// "Replace" action (Sprint 4.8B) is a `softDelete` of the old row followed by a `create` of a
// new one, not a mutation. `uploadedBy` is the only actor column this model has (see
// prisma/schema.prisma's StudentDocument comment) — there is no `updatedBy`/"deleted by" column,
// so `softDelete` below only ever sets `deletedAt`; who performed a delete isn't tracked at the
// schema level yet (a known, flagged gap — see this sprint's final report), the same category
// of gap as the AuditLog TODOs elsewhere in this codebase.
export interface StudentDocumentRepository {
  // `tx` (Sprint 4.8B): optional, same additive pattern established in Sprint 4 — Step 4.
  // Omitted, this opens its own transaction exactly as before. Provided (by
  // replace-student-document.service.ts, which must create the new row and soft-delete the old
  // one atomically), this call joins that transaction instead of committing independently.
  create(
    input: CreateStudentDocumentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentDocumentEntity>;

  // Excludes soft-deleted rows — matches the majority list-method convention in this codebase
  // (ClassRepository.findMany, SectionRepository.findMany, StudentRepository.findMany), not the
  // deliberate exception (StudentRepository.findProfileById, which stays neutral so its caller
  // can apply a specific "soft-deleted student = not found" business rule).
  findByStudent(tenantId: string, studentId: string): Promise<StudentDocumentEntity[]>;

  // Neutral — does NOT filter `deletedAt`, matching StudentRepository.findById/GuardianRepository
  // .findById's plain-lookup precedent. Repositories contain no business rules
  // (docs/CODING_STANDARDS.md §6); interpreting a soft-deleted result is a future service's job.
  findById(tenantId: string, id: string): Promise<StudentDocumentEntity | null>;

  // `tx` (Sprint 4.8B): same additive pattern as `create` above.
  softDelete(tenantId: string, id: string, tx?: Prisma.TransactionClient): Promise<StudentDocumentEntity>;

  // The current (not soft-deleted) `documentType = PHOTO` row for a student, if any — backs the
  // "Preview"/"Replace" requirements from the Photo feature without needing a separate
  // `Student.currentPhotoDocumentId` column.
  findPhoto(tenantId: string, studentId: string): Promise<StudentDocumentEntity | null>;
}
