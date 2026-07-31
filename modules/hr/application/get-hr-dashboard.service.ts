import "server-only";
import { PrismaTeacherAttendanceRepository } from "@/modules/attendance/infrastructure/prisma-teacher-attendance.repository";
import { PrismaPayrollRunRepository } from "@/modules/payroll/infrastructure/prisma-payroll-run.repository";
import { PrismaPayslipRepository } from "@/modules/payroll/infrastructure/prisma-payslip.repository";
import { PrismaSalaryPaymentRepository } from "@/modules/payroll/infrastructure/prisma-salary-payment.repository";
import { PrismaEmployeeRepository } from "../infrastructure/prisma-employee.repository";
import { PrismaEmployeeLeaveRequestRepository } from "../infrastructure/prisma-employee-leave-request.repository";
import type { HrDashboardDTO } from "./dto/hr-dashboard.dto";

const MAX_EMPLOYEES_PER_SCHOOL = 100000;

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// HR Dashboard (Phase 13 spec §12) — composes existing HR/Attendance/Payroll reads into one
// summary. Cross-module composition mirrors get-parent-dashboard.service.ts's own precedent of
// pulling from several modules' read services in one dashboard.
export async function getHrDashboard(tenantId: string, schoolId: string): Promise<HrDashboardDTO> {
  const employeeRepository = new PrismaEmployeeRepository();
  const { items: allEmployees } = await employeeRepository.findMany(tenantId, { page: 1, pageSize: MAX_EMPLOYEES_PER_SCHOOL });
  const employees = allEmployees.filter((employee) => employee.schoolId === schoolId && employee.deletedAt === null);
  const activeEmployees = employees.filter((employee) => employee.isActive);
  const employeeIds = new Set(employees.map((employee) => employee.id));
  const userProfileIds = new Set(employees.map((employee) => employee.userProfileId));

  const today = startOfDay(new Date());

  const [todayAttendance, leaveRequests, payrollRuns] = await Promise.all([
    new PrismaTeacherAttendanceRepository().findByDate(tenantId, today),
    new PrismaEmployeeLeaveRequestRepository().findMany(tenantId, { status: "APPROVED" }),
    new PrismaPayrollRunRepository().findBySchool(tenantId, schoolId),
  ]);

  const presentToday = todayAttendance.filter(
    (record) =>
      userProfileIds.has(record.userProfileId) && (record.status === "PRESENT" || record.status === "LATE")
  ).length;

  const onLeave = leaveRequests.filter(
    (request) =>
      employeeIds.has(request.employeeId) && request.fromDate <= today && request.toDate >= today
  ).length;

  const payrollPending = payrollRuns.filter((run) => run.status === "DRAFT" || run.status === "PROCESSED").length;

  // "Current" billing period = this school's most recently created PayrollRun (findBySchool
  // orders by billingPeriod desc) — salaryPaid/salaryDue are scoped to that one period, per the
  // task brief.
  const currentRun = payrollRuns[0];

  let salaryPaid = 0;
  let salaryDue = 0;
  if (currentRun) {
    const payslips = await new PrismaPayslipRepository().findByRun(tenantId, currentRun.id);
    const paymentRepository = new PrismaSalaryPaymentRepository();
    const paymentsByPayslip = await Promise.all(payslips.map((payslip) => paymentRepository.findByPayslip(tenantId, payslip.id)));

    salaryPaid = Math.round(
      paymentsByPayslip
        .flat()
        .filter((payment) => payment.status === "COMPLETED")
        .reduce((sum, payment) => sum + payment.amount, 0) * 100
    ) / 100;

    salaryDue = Math.round((currentRun.totalNetPay - salaryPaid) * 100) / 100;
  }

  return {
    totalEmployees: activeEmployees.length,
    presentToday,
    onLeave,
    payrollPending,
    salaryPaid,
    salaryDue,
  };
}
