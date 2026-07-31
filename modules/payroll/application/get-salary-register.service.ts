import "server-only";
import { getUserDetail } from "@/modules/users/application/get-user-detail.service";
import { PrismaEmployeeRepository } from "@/modules/hr/infrastructure/prisma-employee.repository";
import { PrismaDepartmentRepository } from "@/modules/hr/infrastructure/prisma-department.repository";
import { PrismaPayrollRunRepository } from "../infrastructure/prisma-payroll-run.repository";
import { PrismaPayslipRepository } from "../infrastructure/prisma-payslip.repository";
import type { SalaryRegisterDTO, SalaryRegisterDepartmentGroup, SalaryRegisterEmployeeRow } from "./dto/payroll-reports.dto";
import type { EmployeeEntity } from "@/modules/hr/domain/employee.entity";
import type { PayslipEntity } from "../domain/payroll-run.entity";

// Salary Register (Phase 13 spec §11.e) — one school's payroll for one billing period, grouped by
// department with a department subtotal. A PayrollRun is unique per (school, billingPeriod) — see
// prisma/schema.prisma's `tenantId_schoolId_billingPeriod` constraint — so "across possibly
// multiple runs" in practice means the (at most) one run this school has for this period; if none
// exists yet, an empty register is returned rather than throwing, since "no payroll processed yet
// for this period" is a normal report state, not an error.
export async function getSalaryRegister(tenantId: string, schoolId: string, billingPeriod: string): Promise<SalaryRegisterDTO> {
  const run = await new PrismaPayrollRunRepository().findBySchoolAndPeriod(tenantId, schoolId, billingPeriod);
  if (!run) {
    return { billingPeriod, departments: [], grandTotalNetPay: 0 };
  }

  const payslips = await new PrismaPayslipRepository().findByRun(tenantId, run.id);
  const employeeRepository = new PrismaEmployeeRepository();
  const departmentRepository = new PrismaDepartmentRepository();

  const employeeCache = new Map<string, EmployeeEntity | null>();
  const departmentNameById = new Map((await departmentRepository.findMany(tenantId)).map((department) => [department.id, department.name]));

  const groups = new Map<string, { departmentName: string; employeeRows: SalaryRegisterEmployeeRow[] }>();

  async function resolveEmployee(payslip: PayslipEntity): Promise<EmployeeEntity | null> {
    let employee = employeeCache.get(payslip.employeeId);
    if (employee === undefined) {
      employee = await employeeRepository.findById(tenantId, payslip.employeeId);
      employeeCache.set(payslip.employeeId, employee);
    }
    return employee;
  }

  for (const payslip of payslips) {
    const employee = await resolveEmployee(payslip);
    const departmentId = employee?.departmentId ?? "UNASSIGNED";
    const departmentName = employee ? departmentNameById.get(employee.departmentId) ?? "" : "Unassigned";

    const userDetail = employee ? await getUserDetail(employee.userProfileId, { tenantId }) : null;
    const row: SalaryRegisterEmployeeRow = {
      employeeId: payslip.employeeId,
      employeeCode: employee?.employeeCode ?? "",
      fullName: userDetail?.profile.fullName ?? "",
      grossEarnings: payslip.grossEarnings,
      totalDeductions: payslip.totalDeductions,
      loanRecoveryAmount: payslip.loanRecoveryAmount,
      netPay: payslip.netPay,
      payslipStatus: payslip.status,
    };

    const group = groups.get(departmentId);
    if (group) {
      group.employeeRows.push(row);
    } else {
      groups.set(departmentId, { departmentName, employeeRows: [row] });
    }
  }

  const departments: SalaryRegisterDepartmentGroup[] = Array.from(groups.entries())
    .map(([departmentId, group]) => ({
      departmentId,
      departmentName: group.departmentName,
      employeeRows: group.employeeRows,
      departmentTotalNetPay: Math.round(group.employeeRows.reduce((sum, row) => sum + row.netPay, 0) * 100) / 100,
    }))
    .sort((a, b) => a.departmentName.localeCompare(b.departmentName));

  const grandTotalNetPay = Math.round(departments.reduce((sum, department) => sum + department.departmentTotalNetPay, 0) * 100) / 100;

  return { billingPeriod, departments, grandTotalNetPay };
}
