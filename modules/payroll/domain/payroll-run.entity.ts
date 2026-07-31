import type { SalaryComponentTypeValue } from "./salary-structure.entity";

export type PayrollRunStatusValue = "DRAFT" | "PROCESSED" | "LOCKED" | "CANCELLED";
export type PayslipStatusValue = "DRAFT" | "GENERATED" | "PAID" | "CANCELLED";

// One row per (school, billingPeriod) — the Payroll Lock state machine lives on `status`
// (DRAFT -> PROCESSED -> LOCKED; CANCELLED is a dead-end).
export interface PayrollRunEntity {
  id: string;
  tenantId: string;
  schoolId: string;
  billingPeriod: string; // "YYYY-MM"
  status: PayrollRunStatusValue;
  processedAt: Date | null;
  processedBy: string | null;
  lockedAt: Date | null;
  lockedBy: string | null;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// One per employee per PayrollRun — the Payroll analogue of FeeInvoice, but representing money
// owed BY the school TO the employee. `billingPeriod` is denormalized from the run at generation
// time so a later run edit never rewrites a settled payslip.
export interface PayslipEntity {
  id: string;
  tenantId: string;
  payrollRunId: string;
  employeeId: string;
  billingPeriod: string;
  basicSalary: number;
  grossEarnings: number;
  totalDeductions: number;
  loanRecoveryAmount: number;
  netPay: number;
  status: PayslipStatusValue;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

// The earnings/deductions breakdown shown on the printed payslip — snapshots the component's
// name/type/amount at generation time.
export interface PayslipComponentEntity {
  id: string;
  tenantId: string;
  payslipId: string;
  // Nullable — a loan-recovery line item isn't tied to any SalaryComponent.
  salaryComponentId: string | null;
  name: string;
  componentType: SalaryComponentTypeValue;
  amount: number;
}
