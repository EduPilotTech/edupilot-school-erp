import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaTeacherAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-teacher-attendance.repository";
import { countByStatus } from "@/modules/attendance/application/attendance-counts.helpers";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import type { StaffAttendanceSummaryReportRow } from "./dto/hr-reports.dto";

const MAX_EMPLOYEES_PER_SCHOOL = 100000;

// Staff Attendance Summary Report (Phase 13 spec §11.b) — for every active employee at a school,
// the given month's present/absent/late/half-day/leave counts. Reuses
// PrismaTeacherAttendanceRepository.findByUserAndDateRange per employee's userProfileId — this is
// a report, correctness over micro-optimization (per the task brief), same reasoning as
// processPayrollRun iterating employees one at a time.
export async function getStaffAttendanceSummaryReport(
  tenantId: string,
  schoolId: string,
  year: number,
  month: number
): Promise<StaffAttendanceSummaryReportRow[]> {
  const employeeRepository = new PrismaEmployeeRepository();
  const { items: allEmployees } = await employeeRepository.findMany(tenantId, {
    page: 1,
    pageSize: MAX_EMPLOYEES_PER_SCHOOL,
  });
  const employees = allEmployees.filter(
    (employee) => employee.schoolId === schoolId && employee.deletedAt === null && employee.isActive
  );

  // `month` is 1-indexed at this boundary; JS Date months are 0-indexed — the exclusive end of
  // the month is day 0 of the *next* month, mirroring getStaffMonthlyAttendanceReport's own
  // date-range construction.
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const attendanceRepository = new PrismaTeacherAttendanceRepository();

  return Promise.all(
    employees.map(async (employee): Promise<StaffAttendanceSummaryReportRow> => {
      const [userDetail, records] = await Promise.all([
        getUserDetail(employee.userProfileId, { tenantId }),
        attendanceRepository.findByUserAndDateRange(tenantId, employee.userProfileId, startDate, endDate),
      ]);
      const counts = countByStatus(records.map((record) => record.status));

      return {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        fullName: userDetail?.profile.fullName ?? "",
        presentDays: counts.PRESENT,
        absentDays: counts.ABSENT,
        lateDays: counts.LATE,
        halfDays: counts.HALF_DAY,
        leaveDays: counts.LEAVE,
      };
    })
  );
}
