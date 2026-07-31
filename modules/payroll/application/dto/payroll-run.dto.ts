import { z } from "zod";
import type { PayrollRunStatusValue, PayslipStatusValue } from "../../domain/payroll-run.entity";
import type { SalaryComponentTypeValue } from "../../domain/salary-structure.entity";

export const createPayrollRunSchema = z.object({
  schoolId: z.string().uuid("School is required."),
  billingPeriod: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing period must be in YYYY-MM format."),
});
export type CreatePayrollRunServiceInput = z.infer<typeof createPayrollRunSchema>;

export interface PayrollRunDTO {
  id: string;
  schoolId: string;
  billingPeriod: string;
  status: PayrollRunStatusValue;
  processedAt: string | null;
  lockedAt: string | null;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
}

export interface ProcessPayrollRunResultDTO {
  payrollRun: PayrollRunDTO;
  payslipsGenerated: number;
  skippedEmployeeIds: string[];
}

export interface PayslipComponentDTO {
  id: string;
  salaryComponentId: string | null;
  name: string;
  componentType: SalaryComponentTypeValue;
  amount: number;
}

export interface PayslipDTO {
  id: string;
  payrollRunId: string;
  employeeId: string;
  billingPeriod: string;
  basicSalary: number;
  grossEarnings: number;
  totalDeductions: number;
  loanRecoveryAmount: number;
  netPay: number;
  status: PayslipStatusValue;
  generatedAt: string;
}

export interface PayslipWithComponentsDTO extends PayslipDTO {
  components: PayslipComponentDTO[];
}
