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
export interface TeacherAttendanceEntity {
  id: string;
  tenantId: string;
  userProfileId: string;
  date: Date;
  status: AttendanceStatusValue;
  remarks: string | null;
  markedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
