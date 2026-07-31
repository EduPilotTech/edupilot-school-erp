import type { PayrollRunStatusValue, PayslipStatusValue } from "../../domain/payroll-run.entity";

// Phase 13 spec §11 — Payroll read-only reports. Plain interfaces, no zod (see
// modules/hr/application/dto/hr-reports.dto.ts for the sibling HR reports).

// --- d. Payroll Report -----------------------------------------------------------------------

export interface PayrollReportEmployeeRow {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  grossEarnings: number;
  totalDeductions: number;
  loanRecoveryAmount: number;
  netPay: number;
  payslipStatus: PayslipStatusValue;
}

export interface PayrollReportDTO {
  payrollRunId: string;
  billingPeriod: string;
  status: PayrollRunStatusValue;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  payslipCount: number;
  rows: PayrollReportEmployeeRow[];
}

// --- e. Salary Register ----------------------------------------------------------------------

export interface SalaryRegisterEmployeeRow {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  grossEarnings: number;
  totalDeductions: number;
  loanRecoveryAmount: number;
  netPay: number;
  payslipStatus: PayslipStatusValue;
}

export interface SalaryRegisterDepartmentGroup {
  departmentId: string;
  departmentName: string;
  employeeRows: SalaryRegisterEmployeeRow[];
  departmentTotalNetPay: number;
}

export interface SalaryRegisterDTO {
  billingPeriod: string;
  departments: SalaryRegisterDepartmentGroup[];
  grandTotalNetPay: number;
}
