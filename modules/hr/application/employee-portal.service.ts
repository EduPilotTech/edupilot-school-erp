import "server-only";
import { ValidationError } from "@/lib/errors";
import { getStaffMonthlyAttendanceReport } from "@/modules/attendance/application/get-staff-monthly-attendance-report.service";
import type { StaffMonthlyAttendanceReportDTO } from "@/modules/attendance/application/dto/attendance-report.dto";
import { getEmployeeSalaryHistory, getPayslip } from "@/modules/payroll/application/payroll-run.service";
import type { PayslipDTO, PayslipWithComponentsDTO } from "@/modules/payroll/application/dto/payroll-run.dto";
import { PayslipNotFoundError } from "@/modules/payroll/domain/errors";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { EmployeeNotFoundError } from "../domain/errors";
import { getEmployeeProfile } from "./get-employee-profile.service";
import { getLeaveBalances } from "./employee-leave-balance.service";
import { listLeaveRequests } from "./list-employee-leave-requests.service";
import { listEmployeeDocuments } from "./list-employee-documents.service";
import { updateEmployee } from "./employee.service";
import { updateMyPersonalInfoSchema, type EmployeeDTO, type EmployeeProfileDTO } from "./dto/employee.dto";
import type { EmployeeLeaveBalanceDTO, EmployeeLeaveRequestDTO } from "./dto/leave.dto";
import type { EmployeeDocumentListItemDTO } from "./dto/employee-document.dto";

// Employee Portal self-service read/write services (Phase 13 spec §9) — every function here is
// scoped to exactly ONE employee (never cross-employee) and is a thin composition of existing
// HR/Attendance/Payroll application services. No business logic is reimplemented; each function
// simply resolves `employeeId` -> the right key for the underlying service and calls it.

async function requireEmployee(tenantId: string, employeeId: string) {
  const employee = await new PrismaEmployeeRepository().findById(tenantId, employeeId);
  if (!employee || employee.deletedAt !== null) throw new EmployeeNotFoundError();
  return employee;
}

// getStaffMonthlyAttendanceReport is keyed by userProfileId, not employeeId — resolve it via the
// employee's own record first.
export async function getMyAttendance(
  tenantId: string,
  employeeId: string,
  year: number,
  month: number
): Promise<StaffMonthlyAttendanceReportDTO> {
  const employee = await requireEmployee(tenantId, employeeId);
  return getStaffMonthlyAttendanceReport({ userProfileId: employee.userProfileId, year, month }, { tenantId });
}

export async function getMyLeaveBalance(tenantId: string, employeeId: string, year: number): Promise<EmployeeLeaveBalanceDTO[]> {
  await requireEmployee(tenantId, employeeId);
  return getLeaveBalances({ employeeId, year }, { tenantId });
}

export async function getMyLeaveHistory(tenantId: string, employeeId: string): Promise<EmployeeLeaveRequestDTO[]> {
  await requireEmployee(tenantId, employeeId);
  return listLeaveRequests({ employeeId }, { tenantId });
}

export async function getMyPayslips(tenantId: string, employeeId: string): Promise<PayslipDTO[]> {
  await requireEmployee(tenantId, employeeId);
  return getEmployeeSalaryHistory(tenantId, employeeId);
}

// Security-critical: verifies the payslip actually belongs to `employeeId` before returning it —
// without this check, any employee could read another employee's payslip by guessing/enumerating
// `payslipId`. Throws the same PayslipNotFoundError a genuinely-missing payslip would throw, so a
// caller can't distinguish "doesn't exist" from "exists but isn't yours".
export async function getMyPayslipDetail(tenantId: string, employeeId: string, payslipId: string): Promise<PayslipWithComponentsDTO> {
  await requireEmployee(tenantId, employeeId);
  const payslip = await getPayslip(tenantId, payslipId);
  if (!payslip || payslip.employeeId !== employeeId) {
    throw new PayslipNotFoundError();
  }
  return payslip;
}

export async function getMyDocuments(tenantId: string, employeeId: string): Promise<EmployeeDocumentListItemDTO[]> {
  await requireEmployee(tenantId, employeeId);
  return listEmployeeDocuments({ employeeId }, { tenantId });
}

export async function getMyProfile(tenantId: string, employeeId: string): Promise<EmployeeProfileDTO> {
  return getEmployeeProfile(employeeId, { tenantId });
}

// Restricted self-service update — only qualification/emergencyContact* are reachable through
// updateMyPersonalInfoSchema (see modules/hr/application/dto/employee.dto.ts's comment).
// department/designation/employmentType/employmentStatus/salary stay HR-managed only: this
// function never accepts them, so there is no field to strip — the restriction is structural.
export async function updateMyPersonalInfo(
  tenantId: string,
  employeeId: string,
  input: unknown,
  actingUserId: string
): Promise<EmployeeDTO> {
  const parsed = updateMyPersonalInfoSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid personal info update.");
  }
  await requireEmployee(tenantId, employeeId);
  return updateEmployee(employeeId, parsed.data, { tenantId, actingUserId });
}
