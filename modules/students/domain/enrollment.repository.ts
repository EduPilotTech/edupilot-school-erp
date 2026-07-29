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

  // Every current (`endDate IS NULL`) enrollment in a Class, across every Section — added for
  // Phase 7's bulk result generation, which needs each currently-enrolled student's own
  // sectionId (not just their name/section-name, which is all the Student List's read-model
  // projection carries). Purely additive: no schema change, no change to any existing method.
  findCurrentForClass(
    tenantId: string,
    classId: string,
    academicSessionId: string
  ): Promise<EnrollmentEntity[]>;

  // `tx` (Sprint 4 — Step 4): optional. Omitted, this opens its own transaction exactly as
  // before — every existing caller is unaffected. Provided (by admit-student.service.ts, which
  // must create Student, Guardian, StudentGuardian, and Enrollment atomically), this call joins
  // that transaction instead of committing independently. See lib/prisma/tenant-context.ts.
  create(input: CreateEnrollmentInput, tx?: Prisma.TransactionClient): Promise<EnrollmentEntity>;

  // The one allowed mutation: sets `endDate`/`status` on an existing row, closing it. Never
  // touches `classId`/`sectionId`/`academicSessionId`. `tx` optional, same Sprint 4 — Step 4
  // pattern as `create` above — added for Phase 7's promoteStudents service, which must close
  // the old Enrollment and create the new one atomically, per Decision 2 (reuse Enrollment
  // directly, no Promotion model).
  close(
    tenantId: string,
    id: string,
    endDate: Date,
    status: EnrollmentStatusValue,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<EnrollmentEntity>;
}
