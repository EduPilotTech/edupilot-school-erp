import { z } from "zod";
import type { AttendanceStatusValue } from "../../domain/attendance.entity";

export const getDailyAttendanceReportSchema = z.object({
  classId: z.string().uuid("Class is required."),
  sectionId: z.string().uuid("Section is required."),
  date: z.coerce.date(),
});
export type GetDailyAttendanceReportInput = z.infer<typeof getDailyAttendanceReportSchema>;

export const getClassAttendanceSummarySchema = z.object({
  classId: z.string().uuid("Class is required."),
  sectionId: z.string().uuid("Section is required."),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type GetClassAttendanceSummaryInput = z.infer<typeof getClassAttendanceSummarySchema>;

export const getStudentAttendanceReportSchema = z.object({
  studentId: z.string().uuid("Invalid student id."),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type GetStudentAttendanceReportInput = z.infer<typeof getStudentAttendanceReportSchema>;

// `total` excludes `notMarked` — it's the count of days/students that actually have a status.
export interface AttendanceStatusCounts {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  HALF_DAY: number;
  LEAVE: number;
  total: number;
}

export function emptyStatusCounts(): AttendanceStatusCounts {
  return { PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, LEAVE: 0, total: 0 };
}

export interface DailyAttendanceReportRow {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  status: AttendanceStatusValue | null; // null = not yet marked
}

export interface DailyAttendanceReportDTO {
  date: Date;
  rows: DailyAttendanceReportRow[];
  counts: AttendanceStatusCounts;
  notMarkedCount: number;
}

export interface ClassAttendanceSummaryRow {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  counts: AttendanceStatusCounts;
}

export interface ClassAttendanceSummaryDTO {
  startDate: Date;
  endDate: Date;
  rows: ClassAttendanceSummaryRow[];
}

export interface StudentAttendanceReportEntry {
  date: Date;
  status: AttendanceStatusValue;
  remarks: string | null;
}

export interface StudentAttendanceReportDTO {
  studentId: string;
  startDate: Date;
  endDate: Date;
  entries: StudentAttendanceReportEntry[];
  counts: AttendanceStatusCounts;
}

// Phase 13 — Staff Monthly Attendance report, mirroring StudentAttendanceReport's shape but
// scoped to a calendar month (year + month) rather than an arbitrary date range, and carrying
// the additive checkIn/checkOutTime evidence per day.
export const getStaffMonthlyAttendanceReportSchema = z.object({
  userProfileId: z.string().uuid("Invalid user id."),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
export type GetStaffMonthlyAttendanceReportInput = z.infer<typeof getStaffMonthlyAttendanceReportSchema>;

export interface StaffMonthlyAttendanceReportEntry {
  date: Date;
  status: AttendanceStatusValue;
  checkInTime: string | null;
  checkOutTime: string | null;
  remarks: string | null;
}

export interface StaffMonthlyAttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
}

export interface StaffMonthlyAttendanceReportDTO {
  userProfileId: string;
  year: number;
  month: number;
  entries: StaffMonthlyAttendanceReportEntry[];
  summary: StaffMonthlyAttendanceSummary;
}
