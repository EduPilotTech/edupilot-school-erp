import { z } from "zod";
import type { AttendanceStatusValue } from "../../domain/attendance.entity";

export const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"]);

export const markStudentAttendanceSchema = z.object({
  studentId: z.string().uuid("Invalid student id."),
  academicSessionId: z.string().uuid("Academic session is required."),
  classId: z.string().uuid("Class is required."),
  sectionId: z.string().uuid("Section is required."),
  date: z.coerce.date(),
  status: attendanceStatusSchema,
  remarks: z.string().trim().max(500).optional(),
});
export type MarkStudentAttendanceServiceInput = z.infer<typeof markStudentAttendanceSchema>;

// Bulk Mark Attendance: one session/class/section/date shared by every entry — matches a
// class-roster UI where the teacher picks the class and date once, then sets a status per
// student, not per-entry re-selection of session/class/section.
export const bulkMarkStudentAttendanceSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  classId: z.string().uuid("Class is required."),
  sectionId: z.string().uuid("Section is required."),
  date: z.coerce.date(),
  entries: z
    .array(
      z.object({
        studentId: z.string().uuid("Invalid student id."),
        status: attendanceStatusSchema,
        remarks: z.string().trim().max(500).optional(),
      })
    )
    .min(1, "At least one student is required."),
});
export type BulkMarkStudentAttendanceServiceInput = z.infer<typeof bulkMarkStudentAttendanceSchema>;

export const markTeacherAttendanceSchema = z.object({
  userProfileId: z.string().uuid("Invalid user id."),
  date: z.coerce.date(),
  status: attendanceStatusSchema,
  remarks: z.string().trim().max(500).optional(),
});
export type MarkTeacherAttendanceServiceInput = z.infer<typeof markTeacherAttendanceSchema>;

export interface StudentAttendanceDTO {
  id: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  date: Date;
  status: AttendanceStatusValue;
  remarks: string | null;
  markedBy: string | null;
}

export interface TeacherAttendanceDTO {
  id: string;
  userProfileId: string;
  date: Date;
  status: AttendanceStatusValue;
  remarks: string | null;
  markedBy: string | null;
}
