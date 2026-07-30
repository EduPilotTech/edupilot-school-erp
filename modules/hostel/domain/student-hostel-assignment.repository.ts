import type { Prisma } from "@/lib/generated/prisma/client";
import type { DietTypeValue, HostelAssignmentStatusValue, StudentHostelAssignmentEntity } from "./student-hostel-assignment.entity";

export interface CreateStudentHostelAssignmentInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  roomId: string;
  bedId: string;
  dietPreference?: DietTypeValue | null;
  checkInDate: Date;
  createdBy?: string | null;
}

// This interface deliberately exposes only `create` and `close` — no generic `update` — mirroring
// EnrollmentRepository's own "never overwrite historical data" discipline exactly. A transfer or
// check-out closes the current row (`checkOutDate` + `status`) and, for a transfer, a new `create`
// follows in the same transaction — there is no method that lets a caller mutate `roomId`/`bedId`
// on an existing row.
export interface StudentHostelAssignmentRepository {
  // The row with `checkOutDate IS NULL` for this student in this AcademicSession, if any —
  // "current" is derived this way, not stored as a separate flag that could drift out of sync.
  findCurrentForStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<StudentHostelAssignmentEntity | null>;

  findHistoryForStudent(tenantId: string, studentId: string): Promise<StudentHostelAssignmentEntity[]>;

  findCurrentForRoom(tenantId: string, roomId: string): Promise<StudentHostelAssignmentEntity[]>;

  findCurrentForAcademicSession(tenantId: string, academicSessionId: string): Promise<StudentHostelAssignmentEntity[]>;

  create(
    input: CreateStudentHostelAssignmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentHostelAssignmentEntity>;

  // The one allowed mutation: sets `checkOutDate`/`status` on an existing row, closing it. Never
  // touches `roomId`/`bedId`/`academicSessionId`.
  close(
    tenantId: string,
    id: string,
    checkOutDate: Date,
    status: HostelAssignmentStatusValue,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<StudentHostelAssignmentEntity>;
}
