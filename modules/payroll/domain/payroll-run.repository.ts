import type { Prisma } from "@/lib/generated/prisma/client";
import type { PayrollRunEntity, PayslipComponentEntity, PayslipEntity, PayslipStatusValue } from "./payroll-run.entity";
import type { SalaryComponentTypeValue } from "./salary-structure.entity";

export interface CreatePayrollRunInput {
  tenantId: string;
  schoolId: string;
  billingPeriod: string;
  createdBy?: string | null;
}

export interface ProcessPayrollRunInput {
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  processedBy: string | null;
}

export interface PayrollRunRepository {
  findById(tenantId: string, id: string): Promise<PayrollRunEntity | null>;
  findBySchoolAndPeriod(tenantId: string, schoolId: string, billingPeriod: string): Promise<PayrollRunEntity | null>;
  findBySchool(tenantId: string, schoolId?: string): Promise<PayrollRunEntity[]>;
  create(input: CreatePayrollRunInput, tx?: Prisma.TransactionClient): Promise<PayrollRunEntity>;
  // Marks the run PROCESSED and stamps its aggregate totals — the one mutation that transitions
  // DRAFT -> PROCESSED. Must accept `tx` — called from inside the single processing transaction.
  markProcessed(tenantId: string, id: string, input: ProcessPayrollRunInput, tx?: Prisma.TransactionClient): Promise<PayrollRunEntity>;
  markLocked(tenantId: string, id: string, lockedBy: string | null, tx?: Prisma.TransactionClient): Promise<PayrollRunEntity>;
  // Applies a delta (positive or negative) to the run's own aggregate totals via an atomic
  // increment — used by regeneratePayslip, which changes one payslip's amounts after the run's
  // totals were already stamped by markProcessed, so the run's own totals must move by the
  // difference rather than being recomputed from scratch.
  adjustTotals(
    tenantId: string,
    id: string,
    delta: { deltaGross: number; deltaDeductions: number; deltaNetPay: number },
    tx?: Prisma.TransactionClient
  ): Promise<PayrollRunEntity>;
}

export interface CreatePayslipInput {
  tenantId: string;
  payrollRunId: string;
  employeeId: string;
  billingPeriod: string;
  basicSalary: number;
  grossEarnings: number;
  totalDeductions: number;
  loanRecoveryAmount: number;
  netPay: number;
  status?: PayslipStatusValue;
  createdBy?: string | null;
}

export interface UpdatePayslipInput {
  basicSalary: number;
  grossEarnings: number;
  totalDeductions: number;
  loanRecoveryAmount: number;
  netPay: number;
  status?: PayslipStatusValue;
  updatedBy?: string | null;
}

export interface PayslipListFilter {
  employeeId?: string;
  payrollRunId?: string;
  billingPeriod?: string;
}

export interface PayslipRepository {
  findById(tenantId: string, id: string): Promise<PayslipEntity | null>;
  findByEmployeeAndRun(tenantId: string, employeeId: string, payrollRunId: string): Promise<PayslipEntity | null>;
  findMany(tenantId: string, filter: PayslipListFilter): Promise<PayslipEntity[]>;
  findByRun(tenantId: string, payrollRunId: string): Promise<PayslipEntity[]>;
  create(input: CreatePayslipInput, tx?: Prisma.TransactionClient): Promise<PayslipEntity>;
  update(tenantId: string, id: string, input: UpdatePayslipInput, tx?: Prisma.TransactionClient): Promise<PayslipEntity>;
  updateStatus(tenantId: string, id: string, status: PayslipStatusValue, updatedBy: string | null, tx?: Prisma.TransactionClient): Promise<PayslipEntity>;
}

export interface CreatePayslipComponentInput {
  tenantId: string;
  payslipId: string;
  salaryComponentId?: string | null;
  name: string;
  componentType: SalaryComponentTypeValue;
  amount: number;
}

export interface PayslipComponentRepository {
  findByPayslip(tenantId: string, payslipId: string): Promise<PayslipComponentEntity[]>;
  create(input: CreatePayslipComponentInput, tx?: Prisma.TransactionClient): Promise<PayslipComponentEntity>;
  createMany(inputs: CreatePayslipComponentInput[], tx?: Prisma.TransactionClient): Promise<void>;
  // Regeneration deletes-then-recreates a payslip's component lines rather than diffing them.
  deleteByPayslip(tenantId: string, payslipId: string, tx?: Prisma.TransactionClient): Promise<void>;
}
