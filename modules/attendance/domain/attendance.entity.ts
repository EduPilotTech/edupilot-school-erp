// Phase 5 — Attendance Management. One status vocabulary shared by both Student and Teacher
// attendance, matching the Prisma AttendanceStatus enum.
export type AttendanceStatusValue = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE";

// Domain view of StudentAttendance, decoupled from Prisma's generated type.
// `academicSessionId`/`classId`/`sectionId` are captured at mark-time, not resolved live from
// Enrollment — see prisma/schema.prisma's StudentAttendance comment for why (a promoted/
// transferred student's historical attendance must keep showing the class they were in then).
export interface StudentAttendanceEntity {
  id: string;
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  date: Date;
  status: AttendanceStatusValue;
  remarks: string | null;
  markedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Domain view of TeacherAttendance. `userProfileId` references UserProfile directly — no
// dedicated Teacher entity exists (see modules/attendance's own README-equivalent comment in
// get-student... no, see the domain repository file below for the full reasoning).
//
// Phase 13 — `checkInTime`/`checkOutTime` are additive, nullable "HH:mm" strings (the actual
// clock time), supplementary evidence for Monthly Attendance / Late-Entry / Early-Exit reporting.
// `status` remains the single source of truth for PRESENT/ABSENT/LATE/HALF_DAY/LEAVE, exactly as
// before — these two fields never drive a second classification layer. Prisma's `@db.Time`
// column is converted to/from this plain string at the infrastructure boundary (see
// prisma-teacher-attendance.repository.ts's toTimeString/fromTimeString).
export interface TeacherAttendanceEntity {
  id: string;
  tenantId: string;
  userProfileId: string;
  date: Date;
  status: AttendanceStatusValue;
  remarks: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  markedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
