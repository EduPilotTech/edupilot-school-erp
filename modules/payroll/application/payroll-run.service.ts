import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "@/modules/hr/infrastructure/prisma-employee.repository";
import { notifyEmployee } from "@/modules/hr/application/hr-notification.helpers";
import { PrismaPayrollRunRepository } from "../infrastructure/prisma-payroll-run.repository";
import { PrismaPayslipRepository } from "../infrastructure/prisma-payslip.repository";
import { PrismaPayslipComponentRepository } from "../infrastructure/prisma-payslip-component.repository";
import { PrismaEmployeeSalaryAssignmentRepository } from "../infrastructure/prisma-employee-salary-assignment.repository";
import { PrismaSalaryComponentRepository } from "../infrastructure/prisma-salary-component.repository";
import { PrismaEmployeeLoanRepository } from "../infrastructure/prisma-employee-loan.repository";
import {
  PayrollRunAlreadyExistsError,
  PayrollRunLockedError,
  PayrollRunNotDraftError,
  PayrollRunNotFoundError,
  PayrollRunNotProcessedError,
  PayslipNotFoundError,
} from "../domain/errors";
import { computeGrossAndDeductions, distributeLoanReversal, isPayrollEligible } from "./salary-calculation.helpers";
import { appendPayrollLedgerEntry } from "./payroll-ledger.helpers";
import { recordPayrollAudit } from "./payroll-audit.helpers";
import { recoverLoanInstallment, reverseLoanRecovery } from "./employee-loan.service";
import {
  createPayrollRunSchema,
  type CreatePayrollRunServiceInput,
  type PayrollRunDTO,
  type PayslipComponentDTO,
  type PayslipDTO,
  type PayslipWithComponentsDTO,
  type ProcessPayrollRunResultDTO,
} from "./dto/payroll-run.dto";
import type { PayrollRunEntity, PayslipComponentEntity, PayslipEntity } from "../domain/payroll-run.entity";
import type { CreatePayslipComponentInput, PayslipListFilter } from "../domain/payroll-run.repository";
import type { EmployeeLoanEntity } from "../domain/employee-loan.entity";
import type { SalaryComponentEntity } from "../domain/salary-structure.entity";
import type { PayrollContext } from "./payroll-context";
import { prisma } from "@/lib/prisma";

const MAX_EMPLOYEES_PER_SCHOOL = 100000;

function toRunDTO(entity: PayrollRunEntity): PayrollRunDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    billingPeriod: entity.billingPeriod,
    status: entity.status,
    processedAt: entity.processedAt ? entity.processedAt.toISOString() : null,
    lockedAt: entity.lockedAt ? entity.lockedAt.toISOString() : null,
    totalGross: entity.totalGross,
    totalDeductions: entity.totalDeductions,
    totalNetPay: entity.totalNetPay,
  };
}

function toPayslipDTO(entity: PayslipEntity): PayslipDTO {
  return {
    id: entity.id,
    payrollRunId: entity.payrollRunId,
    employeeId: entity.employeeId,
    billingPeriod: entity.billingPeriod,
    basicSalary: entity.basicSalary,
    grossEarnings: entity.grossEarnings,
    totalDeductions: entity.totalDeductions,
    loanRecoveryAmount: entity.loanRecoveryAmount,
    netPay: entity.netPay,
    status: entity.status,
    generatedAt: entity.generatedAt.toISOString(),
  };
}

function toPayslipComponentDTO(entity: PayslipComponentEntity): PayslipComponentDTO {
  return {
    id: entity.id,
    salaryComponentId: entity.salaryComponentId,
    name: entity.name,
    componentType: entity.componentType,
    amount: entity.amount,
  };
}

const payrollRunRepository = new PrismaPayrollRunRepository();
const payslipRepository = new PrismaPayslipRepository();
const payslipComponentRepository = new PrismaPayslipComponentRepository();
const assignmentRepository = new PrismaEmployeeSalaryAssignmentRepository();
const salaryComponentRepository = new PrismaSalaryComponentRepository();
const loanRepository = new PrismaEmployeeLoanRepository();
const employeeRepository = new PrismaEmployeeRepository();

export async function createPayrollRun(input: unknown, context: PayrollContext): Promise<PayrollRunDTO> {
  const parsed = createPayrollRunSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid payroll run data.");
  }
  const data: CreatePayrollRunServiceInput = parsed.data;
  const { tenantId, actingUserId } = context;

  const existing = await payrollRunRepository.findBySchoolAndPeriod(tenantId, data.schoolId, data.billingPeriod);
  if (existing) {
    throw new PayrollRunAlreadyExistsError();
  }

  try {
    const run = await payrollRunRepository.create({
      tenantId,
      schoolId: data.schoolId,
      billingPeriod: data.billingPeriod,
      createdBy: actingUserId,
    });
    return toRunDTO(run);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new PayrollRunAlreadyExistsError();
    }
    throw error;
  }
}

// THE generation engine — see the module-level brief for the full step list (a-j). Runs entirely
// inside one transaction so a mid-run failure never leaves partial payslips, partial ledger
// entries, or a stale run status behind.
export async function processPayrollRun(payrollRunId: string, context: PayrollContext): Promise<ProcessPayrollRunResultDTO> {
  const { tenantId, actingUserId } = context;

  const run = await payrollRunRepository.findById(tenantId, payrollRunId);
  if (!run) throw new PayrollRunNotFoundError();
  if (run.status !== "DRAFT") throw new PayrollRunNotDraftError();

  // (a) Every employee at this school, payroll-eligible by employment status. EmployeeRepository
  // has no schoolId filter of its own (it's tenant-wide), so this fetches the tenant's employees
  // in one page and filters school + eligibility here.
  const { items: allEmployees } = await employeeRepository.findMany(tenantId, { page: 1, pageSize: MAX_EMPLOYEES_PER_SCHOOL });
  const eligibleEmployees = allEmployees.filter(
    (employee) => employee.schoolId === run.schoolId && employee.isActive && isPayrollEligible(employee.employmentStatus)
  );

  const skippedEmployeeIds: string[] = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNetPay = 0;
  let payslipsGenerated = 0;

  const componentsByStructure = new Map<string, SalaryComponentEntity[]>();

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    for (const employee of eligibleEmployees) {
      const assignment = await assignmentRepository.findCurrentForEmployee(tenantId, employee.id);
      if (!assignment) {
        skippedEmployeeIds.push(employee.id);
        continue;
      }

      let components = componentsByStructure.get(assignment.salaryStructureId);
      if (!components) {
        components = await salaryComponentRepository.findByStructure(tenantId, assignment.salaryStructureId, true);
        componentsByStructure.set(assignment.salaryStructureId, components);
      }

      const { earnings, deductions, grossEarnings, totalDeductions: employeeDeductions } = computeGrossAndDeductions(
        assignment.basicSalary,
        components
      );

      const activeLoans = await loanRepository.findActiveByEmployee(tenantId, employee.id, tx);
      let loanRecoveryAmount = 0;
      for (const loan of activeLoans) {
        const { recovered } = await recoverLoanInstallment(tenantId, loan, loan.monthlyRecoveryAmount, tx);
        loanRecoveryAmount = Math.round((loanRecoveryAmount + recovered) * 100) / 100;
      }

      const netPay = Math.round((grossEarnings - employeeDeductions - loanRecoveryAmount) * 100) / 100;

      const payslip = await payslipRepository.create(
        {
          tenantId,
          payrollRunId: run.id,
          employeeId: employee.id,
          billingPeriod: run.billingPeriod,
          basicSalary: assignment.basicSalary,
          grossEarnings,
          totalDeductions: employeeDeductions,
          loanRecoveryAmount,
          netPay,
          status: "GENERATED",
          createdBy: actingUserId,
        },
        tx
      );

      const componentInputs: CreatePayslipComponentInput[] = [...earnings, ...deductions].map((line) => ({
        tenantId,
        payslipId: payslip.id,
        salaryComponentId: line.salaryComponentId,
        name: line.name,
        componentType: line.componentType,
        amount: line.amount,
      }));
      if (loanRecoveryAmount > 0) {
        componentInputs.push({
          tenantId,
          payslipId: payslip.id,
          salaryComponentId: null,
          name: "Loan Recovery",
          componentType: "DEDUCTION",
          amount: loanRecoveryAmount,
        });
      }
      await payslipComponentRepository.createMany(componentInputs, tx);

      await appendPayrollLedgerEntry(
        {
          tenantId,
          employeeId: employee.id,
          entryType: "PAYSLIP_GENERATED",
          referenceType: "Payslip",
          referenceId: payslip.id,
          credit: netPay,
          description: `Payslip generated for ${run.billingPeriod}`,
          createdBy: actingUserId,
        },
        tx
      );

      totalGross = Math.round((totalGross + grossEarnings) * 100) / 100;
      totalDeductions = Math.round((totalDeductions + employeeDeductions) * 100) / 100;
      totalNetPay = Math.round((totalNetPay + netPay) * 100) / 100;
      payslipsGenerated += 1;
    }

    await recordPayrollAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "PAYROLL_RUN_PROCESSED",
        entityType: "PayrollRun",
        entityId: run.id,
        beforeState: run,
        afterState: { payslipsGenerated, skippedEmployeeIds, totalGross, totalDeductions, totalNetPay },
      },
      tx
    );

    const processedRun = await payrollRunRepository.markProcessed(
      tenantId,
      run.id,
      { totalGross, totalDeductions, totalNetPay, processedBy: actingUserId },
      tx
    );

    return processedRun;
  });

  return { payrollRun: toRunDTO(result), payslipsGenerated, skippedEmployeeIds };
}

export async function lockPayrollRun(payrollRunId: string, context: PayrollContext): Promise<PayrollRunDTO> {
  const { tenantId, actingUserId } = context;
  const run = await payrollRunRepository.findById(tenantId, payrollRunId);
  if (!run) throw new PayrollRunNotFoundError();
  if (run.status !== "PROCESSED") throw new PayrollRunNotProcessedError();

  const locked = await payrollRunRepository.markLocked(tenantId, payrollRunId, actingUserId);

  await recordPayrollAudit({
    tenantId,
    actorId: actingUserId,
    action: "PAYROLL_RUN_LOCKED",
    entityType: "PayrollRun",
    entityId: locked.id,
    beforeState: run,
    afterState: locked,
  });

  return toRunDTO(locked);
}

// Recomputes and overwrites a single payslip (basic salary + components) from the employee's
// CURRENT salary assignment and salary structure — used to correct a payslip after e.g. a
// component's value was fixed post-generation. Only permitted while the parent run is not yet
// LOCKED. Loan recovery is reversed-then-reapplied (never double-applied) and the parent run's
// own aggregate totals + the employee's ledger move by the delta, not the full new amount, so
// running this more than once stays arithmetically correct.
export async function regeneratePayslip(payslipId: string, context: PayrollContext): Promise<PayslipDTO> {
  const { tenantId, actingUserId } = context;

  const payslip = await payslipRepository.findById(tenantId, payslipId);
  if (!payslip) throw new PayslipNotFoundError();

  const run = await payrollRunRepository.findById(tenantId, payslip.payrollRunId);
  if (!run) throw new PayrollRunNotFoundError();
  if (run.status === "LOCKED") throw new PayrollRunLockedError();

  const assignment = await assignmentRepository.findCurrentForEmployee(tenantId, payslip.employeeId);
  if (!assignment) {
    throw new ValidationError("This employee has no current salary assignment to regenerate the payslip from.");
  }

  const components = await salaryComponentRepository.findByStructure(tenantId, assignment.salaryStructureId, true);
  const { earnings, deductions, grossEarnings, totalDeductions } = computeGrossAndDeductions(assignment.basicSalary, components);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    // Reverse the previous recovery before reapplying — never double-apply.
    const allLoans = await loanRepository.findByEmployee(tenantId, payslip.employeeId);
    const oldestFirst = [...allLoans].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const reversalLines = distributeLoanReversal(payslip.loanRecoveryAmount, oldestFirst);
    const loanById = new Map<string, EmployeeLoanEntity>(oldestFirst.map((loan) => [loan.id, loan]));
    for (const line of reversalLines) {
      const loan = loanById.get(line.loanId)!;
      const restored = await reverseLoanRecovery(tenantId, loan, line.amount, tx);
      loanById.set(line.loanId, restored);
    }

    // Reapply the freshly computed recovery against the now-restored loan balances.
    let loanRecoveryAmount = 0;
    for (const loan of oldestFirst) {
      const current = loanById.get(loan.id)!;
      if (current.status !== "ACTIVE") continue;
      const { recovered } = await recoverLoanInstallment(tenantId, current, current.monthlyRecoveryAmount, tx);
      loanRecoveryAmount = Math.round((loanRecoveryAmount + recovered) * 100) / 100;
    }

    const netPay = Math.round((grossEarnings - totalDeductions - loanRecoveryAmount) * 100) / 100;

    const before = payslip;
    const after = await payslipRepository.update(
      tenantId,
      payslip.id,
      {
        basicSalary: assignment.basicSalary,
        grossEarnings,
        totalDeductions,
        loanRecoveryAmount,
        netPay,
        status: payslip.status,
        updatedBy: actingUserId,
      },
      tx
    );

    await payslipComponentRepository.deleteByPayslip(tenantId, payslip.id, tx);
    const componentInputs: CreatePayslipComponentInput[] = [...earnings, ...deductions].map((line) => ({
      tenantId,
      payslipId: payslip.id,
      salaryComponentId: line.salaryComponentId,
      name: line.name,
      componentType: line.componentType,
      amount: line.amount,
    }));
    if (loanRecoveryAmount > 0) {
      componentInputs.push({
        tenantId,
        payslipId: payslip.id,
        salaryComponentId: null,
        name: "Loan Recovery",
        componentType: "DEDUCTION",
        amount: loanRecoveryAmount,
      });
    }
    await payslipComponentRepository.createMany(componentInputs, tx);

    const deltaGross = Math.round((grossEarnings - before.grossEarnings) * 100) / 100;
    const deltaDeductions = Math.round((totalDeductions - before.totalDeductions) * 100) / 100;
    const deltaNetPay = Math.round((netPay - before.netPay) * 100) / 100;

    await payrollRunRepository.adjustTotals(tenantId, run.id, { deltaGross, deltaDeductions, deltaNetPay }, tx);

    if (deltaNetPay !== 0) {
      await appendPayrollLedgerEntry(
        {
          tenantId,
          employeeId: payslip.employeeId,
          entryType: "PAYSLIP_GENERATED",
          referenceType: "Payslip",
          referenceId: payslip.id,
          credit: deltaNetPay > 0 ? deltaNetPay : 0,
          debit: deltaNetPay < 0 ? -deltaNetPay : 0,
          description: `Payslip regenerated for ${payslip.billingPeriod}`,
          createdBy: actingUserId,
        },
        tx
      );
    }

    await recordPayrollAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "PAYSLIP_REGENERATED",
        entityType: "Payslip",
        entityId: payslip.id,
        beforeState: before,
        afterState: after,
      },
      tx
    );

    return after;
  });

  const employee = await employeeRepository.findById(tenantId, payslip.employeeId);
  if (employee) {
    await notifyEmployee(tenantId, employee.userProfileId, {
      title: "Payslip Regenerated",
      body: `Your payslip for ${payslip.billingPeriod} has been regenerated. New net pay: ${updated.netPay.toFixed(2)}.`,
      referenceType: "Payslip",
      referenceId: payslip.id,
    });
  }

  return toPayslipDTO(updated);
}

export async function listPayrollRuns(tenantId: string, schoolId?: string): Promise<PayrollRunDTO[]> {
  const runs = await payrollRunRepository.findBySchool(tenantId, schoolId);
  return runs.map(toRunDTO);
}

export async function getPayrollRun(tenantId: string, id: string): Promise<PayrollRunDTO | null> {
  const run = await payrollRunRepository.findById(tenantId, id);
  return run ? toRunDTO(run) : null;
}

export async function listPayslips(tenantId: string, filter: PayslipListFilter): Promise<PayslipDTO[]> {
  const payslips = await payslipRepository.findMany(tenantId, filter);
  return payslips.map(toPayslipDTO);
}

export async function getPayslip(tenantId: string, id: string): Promise<PayslipWithComponentsDTO | null> {
  const payslip = await payslipRepository.findById(tenantId, id);
  if (!payslip) return null;
  const components = await payslipComponentRepository.findByPayslip(tenantId, id);
  return { ...toPayslipDTO(payslip), components: components.map(toPayslipComponentDTO) };
}

// Backs the Employee Portal's "Salary History" — all payslips for an employee across every run,
// newest billing period first.
export async function getEmployeeSalaryHistory(tenantId: string, employeeId: string): Promise<PayslipDTO[]> {
  const payslips = await payslipRepository.findMany(tenantId, { employeeId });
  return payslips.map(toPayslipDTO);
}

export { toRunDTO as toPayrollRunDTO, toPayslipDTO, toPayslipComponentDTO };
