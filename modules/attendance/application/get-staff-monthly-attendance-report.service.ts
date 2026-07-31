import "server-only";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import { PrismaTeacherAttendanceRepository } from "../infrastructure/prisma-teacher-attendance.repository";
import { countByStatus } from "./attendance-counts.helpers";
import {
  getStaffMonthlyAttendanceReportSchema,
  type StaffMonthlyAttendanceReportDTO,
  type StaffMonthlyAttendanceReportEntry,
} from "./dto/attendance-report.dto";

export interface GetStaffMonthlyAttendanceReportContext {
  tenantId: string;
}

// Phase 13 — Staff Monthly Attendance report: one staff member's day-by-day attendance for a
// calendar month, plus checkIn/checkOutTime evidence and aggregate counts (present/absent/late/
// half-day/leave). Mirrors get-student-attendance-report.service.ts's exact shape, scoped to a
// (year, month) instead of an arbitrary date range, per this phase's "Monthly Attendance" report
// requirement.
export async function getStaffMonthlyAttendanceReport(
  input: unknown,
  context: GetStaffMonthlyAttendanceReportContext
): Promise<StaffMonthlyAttendanceReportDTO> {
  const parsed = getStaffMonthlyAttendanceReportSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid report request.");
  }
  const { userProfileId, year, month } = parsed.data;
  const { tenantId } = context;

  const userProfileRepository = new PrismaUserProfileRepository();
  const userProfile = await userProfileRepository.findById(tenantId, userProfileId);
  if (!userProfile || userProfile.deletedAt !== null) {
    throw new NotFoundError("Staff member not found.");
  }

  // `month` is 1-indexed at the API boundary; JS Date months are 0-indexed. The exclusive end of
  // the month is day 0 of the *next* month.
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const records = await new PrismaTeacherAttendanceRepository().findByUserAndDateRange(tenantId, userProfileId, startDate, endDate);

  const entries: StaffMonthlyAttendanceReportEntry[] = records.map((record) => ({
    date: record.date,
    status: record.status,
    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,
    remarks: record.remarks,
  }));

  const counts = countByStatus(records.map((record) => record.status));

  return {
    userProfileId,
    year,
    month,
    entries,
    summary: {
      presentDays: counts.PRESENT,
      absentDays: counts.ABSENT,
      lateDays: counts.LATE,
      halfDays: counts.HALF_DAY,
      leaveDays: counts.LEAVE,
    },
  };
}
