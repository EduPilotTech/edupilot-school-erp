import type { EmploymentStatusValue } from "../../domain/employee.entity";
import type { LeaveRequestStatusValue } from "../../domain/employee-leave-request.entity";

// Phase 13 spec §11 — HR read-only reports. Plain interfaces, no zod: filter params are typed
// directly on the service function signature (see modules/hostel/application/dto/reports.dto.ts
// for the precedent this mirrors).

// --- a. Employee List Report ----------------------------------------------------------------

export interface EmployeeListReportFilter {
  departmentId?: string;
  designationId?: string;
  employmentStatus?: EmploymentStatusValue;
}

export interface EmployeeListReportRow {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  designationName: string;
  employmentTypeName: string;
  employmentStatus: EmploymentStatusValue;
  joiningDate: Date;
}

// --- b. Staff Attendance Summary Report ---------------------------------------------------------

export interface StaffAttendanceSummaryReportRow {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
}

// --- c. Leave Report -------------------------------------------------------------------------

export interface LeaveReportFilter {
  employeeId?: string;
  leaveTypeId?: string;
  status?: LeaveRequestStatusValue;
  fromDate?: Date;
  toDate?: Date;
}

export interface LeaveReportRow {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  isHalfDay: boolean;
  totalDays: number;
  status: LeaveRequestStatusValue;
  reason: string;
}

// --- f. Department Summary Report ---------------------------------------------------------------

export interface DepartmentSummaryReportRow {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  activeCount: number;
  onLeaveCount: number;
}

// --- g. Experience Report ---------------------------------------------------------------------

export interface ExperienceReportRow {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  designationName: string;
  joiningDate: Date;
  experienceYears: number | null;
  tenureYears: number;
}
