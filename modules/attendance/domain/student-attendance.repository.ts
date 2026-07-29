import type { Prisma } from "@/lib/generated/prisma/client";
import type { AttendanceStatusValue, StudentAttendanceEntity } from "./attendance.entity";

export interface MarkStudentAttendanceInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  date: Date;
  status: AttendanceStatusValue;
  remarks?: string | null;
  markedBy?: string | null;
}

// "One attendance record per student per day" (Phase 5's explicit validation requirement) is
// enforced at the database level by `@@unique([tenantId, studentId, date])` — this repository
// expresses that as an UPSERT (`markOne`), not a create-that-can-fail: re-marking a student's
// attendance for a day already marked (e.g. correcting a mistake) updates the existing row
// rather than being rejected. There is deliberately no separate `update`/`create` split, unlike
// Student/Guardian — attendance marking is inherently idempotent-by-day.
export interface StudentAttendanceRepository {
  // `tx` (optional, same additive pattern established in Sprint 4 — Step 4): omitted, opens its
  // own transaction; provided, joins the caller's transaction — needed for bulk-mark, which must
  // upsert many students' attendance atomically.
  markOne(
    input: MarkStudentAttendanceInput,
    tx?: Prisma.TransactionClient
  ): Promise<StudentAttendanceEntity>;

  // Backs Daily Attendance / Bulk Mark's pre-fill (show already-marked statuses) and the Daily
  // Report.
  findByClassAndDate(
    tenantId: string,
    classId: string,
    sectionId: string,
    date: Date
  ): Promise<StudentAttendanceEntity[]>;

  // Backs the Student-wise Report.
  findByStudentAndDateRange(
    tenantId: string,
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudentAttendanceEntity[]>;

  // Backs the Class-wise Report and Monthly Report (when scoped to one class/section).
  findByClassAndDateRange(
    tenantId: string,
    classId: string,
    sectionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudentAttendanceEntity[]>;
}
