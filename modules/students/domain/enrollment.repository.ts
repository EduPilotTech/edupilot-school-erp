import type { Prisma } from "@/lib/generated/prisma/client";
import type { EnrollmentEntity, EnrollmentStatusValue } from "./enrollment.entity";

export interface CreateEnrollmentInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  rollNumber?: string | null;
  startDate: Date;
  createdBy?: string | null;
}

// This interface deliberately exposes only `create` and `close` — no generic `update` — per
// Sprint 4 — Step 1's design: "never overwrite historical enrollment" should be structurally
// hard to violate, not just a documented convention. Anyone needing to change a student's
// class/section must close the current Enrollment and create a new one; there is no method
// that lets a caller mutate `classId`/`sectionId` on an existing row.
export interface EnrollmentRepository {
  // The row with `endDate IS NULL` for this student in this AcademicSession, if any — "current"
  // is derived this way, not stored as a separate flag that could drift out of sync.
  findCurrentForStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<EnrollmentEntity | null>;

  findHistoryForStudent(tenantId: string, studentId: string): Promise<EnrollmentEntity[]>;

  // `tx` (Sprint 4 — Step 4): optional. Omitted, this opens its own transaction exactly as
  // before — every existing caller is unaffected. Provided (by admit-student.service.ts, which
  // must create Student, Guardian, StudentGuardian, and Enrollment atomically), this call joins
  // that transaction instead of committing independently. See lib/prisma/tenant-context.ts.
  create(input: CreateEnrollmentInput, tx?: Prisma.TransactionClient): Promise<EnrollmentEntity>;

  // The one allowed mutation: sets `endDate`/`status` on an existing row, closing it. Never
  // touches `classId`/`sectionId`/`academicSessionId`.
  close(
    tenantId: string,
    id: string,
    endDate: Date,
    status: EnrollmentStatusValue,
    updatedBy: string | null
  ): Promise<EnrollmentEntity>;
}
