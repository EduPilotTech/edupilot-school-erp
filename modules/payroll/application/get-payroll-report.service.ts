import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaEmployeeRepository } from "@/modules/hr/infrastructure/prisma-employee.repository";
import { PrismaPayrollRunRepository } from "../infrastructure/prisma-payroll-run.repository";
import { PrismaPayslipRepository } from "../infrastructure/prisma-payslip.repository";
import { PayrollRunNotFoundError } from "../domain/errors";
import type { PayrollReportDTO, PayrollReportEmployeeRow } from "./dto/payroll-reports.dto";

// Payroll Report (Phase 13 spec §11.d) — one payroll run's summary plus a per-employee payslip
// breakdown, joined with the employee's code/name.
export async function getPayrollReport(tenantId: string, payrollRunId: string): Promise<PayrollReportDTO> {
  const runRepository = new PrismaPayrollRunRepository();
  const run = await runRepository.findById(tenantId, payrollRunId);
  if (!run) throw new PayrollRunNotFoundError();

  const payslips = await new PrismaPayslipRepository().findByRun(tenantId, run.id);
  const employeeRepository = new PrismaEmployeeRepository();

  const rows: PayrollReportEmployeeRow[] = await Promise.all(
    payslips.map(async (payslip): Promise<PayrollReportEmployeeRow> => {
      const employee = await employeeRepository.findById(tenantId, payslip.employeeId);
      const userDetail = employee ? await getUserDetail(employee.userProfileId, { tenantId }) : null;
      return {
        employeeId: payslip.employeeId,
        employeeCode: employee?.employeeCode ?? "",
        fullName: userDetail?.profile.fullName ?? "",
        grossEarnings: payslip.grossEarnings,
        totalDeductions: payslip.totalDeductions,
        loanRecoveryAmount: payslip.loanRecoveryAmount,
        netPay: payslip.netPay,
        payslipStatus: payslip.status,
      };
    })
  );

  return {
    payrollRunId: run.id,
    billingPeriod: run.billingPeriod,
    status: run.status,
    totalGross: run.totalGross,
    totalDeductions: run.totalDeductions,
    totalNetPay: run.totalNetPay,
    payslipCount: payslips.length,
    rows,
  };
}
