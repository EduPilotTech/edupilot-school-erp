import type { Prisma } from "@/lib/generated/prisma/client";
import type { AttendanceStatusValue, TeacherAttendanceEntity } from "./attendance.entity";

export interface MarkTeacherAttendanceInput {
  tenantId: string;
  userProfileId: string;
  date: Date;
  status: AttendanceStatusValue;
  remarks?: string | null;
  // Phase 13 — optional "HH:mm" strings, converted to a Date-with-arbitrary-date-part for
  // Prisma's `@db.Time` column at the repository layer (see the Prisma implementation's
  // toTimeString/fromTimeString).
  checkInTime?: string | null;
  checkOutTime?: string | null;
  markedBy?: string | null;
}

// References UserProfile directly, not a dedicated Teacher entity — per the explicit Phase 5
// scoping decision: no Teacher domain module exists (only a TEACHER role code on UserProfile),
// and building one is out of this phase's scope. "Teacher Attendance" in practice means "staff
// attendance" — this repository works for any UserProfile, not only ones holding the TEACHER
// role. Same upsert-by-day reasoning as StudentAttendanceRepository.markOne.
export interface TeacherAttendanceRepository {
  markOne(
    input: MarkTeacherAttendanceInput,
    tx?: Prisma.TransactionClient
  ): Promise<TeacherAttendanceEntity>;

  // All staff attendance for one day — backs a Daily (staff) view.
  findByDate(tenantId: string, date: Date): Promise<TeacherAttendanceEntity[]>;

  // Backs a staff-member-wise report, the same shape as Student-wise for students.
  findByUserAndDateRange(
    tenantId: string,
    userProfileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TeacherAttendanceEntity[]>;
}
