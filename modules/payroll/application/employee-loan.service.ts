import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaEmployeeRepository } from "@/modules/hr/infrastructure/prisma-employee.repository";
import { EmployeeNotFoundError } from "@/modules/hr/domain/errors";
import { PrismaEmployeeLoanRepository } from "../infrastructure/prisma-employee-loan.repository";
import { EmployeeLoanNotFoundError, InvalidLoanAmountError, LoanCannotBeCancelledError } from "../domain/errors";
import { recordPayrollAudit } from "./payroll-audit.helpers";
import { createEmployeeLoanSchema, type EmployeeLoanDTO } from "./dto/employee-loan.dto";
import type { EmployeeLoanEntity, EmployeeLoanStatusValue } from "../domain/employee-loan.entity";
import type { PayrollContext } from "./payroll-context";

function toDTO(entity: EmployeeLoanEntity): EmployeeLoanDTO {
  return {
    id: entity.id,
    employeeId: entity.employeeId,
    loanType: entity.loanType,
    principalAmount: entity.principalAmount,
    monthlyRecoveryAmount: entity.monthlyRecoveryAmount,
    outstandingAmount: entity.outstandingAmount,
    startDate: entity.startDate.toISOString().slice(0, 10),
    status: entity.status,
    reason: entity.reason,
  };
}

export async function createEmployeeLoan(input: unknown, context: PayrollContext): Promise<EmployeeLoanDTO> {
  const parsed = createEmployeeLoanSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid loan data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const employeeRepository = new PrismaEmployeeRepository();
  const employee = await employeeRepository.findById(tenantId, data.employeeId);
  if (!employee || employee.deletedAt !== null) {
    throw new EmployeeNotFoundError();
  }

  if (data.monthlyRecoveryAmount > data.principalAmount) {
    throw new InvalidLoanAmountError("The monthly recovery amount cannot exceed the principal amount.");
  }

  const repository = new PrismaEmployeeLoanRepository();
  const loan = await repository.create({
    tenantId,
    employeeId: data.employeeId,
    loanType: data.loanType,
    principalAmount: data.principalAmount,
    monthlyRecoveryAmount: data.monthlyRecoveryAmount,
    startDate: data.startDate,
    reason: data.reason ?? null,
    createdBy: actingUserId,
  });

  await recordPayrollAudit({
    tenantId,
    actorId: actingUserId,
    action: "LOAN_CREATED",
    entityType: "EmployeeLoan",
    entityId: loan.id,
    afterState: loan,
  });

  return toDTO(loan);
}

export async function listEmployeeLoans(tenantId: string, employeeId: string, status?: EmployeeLoanStatusValue): Promise<EmployeeLoanDTO[]> {
  const repository = new PrismaEmployeeLoanRepository();
  const loans = await repository.findByEmployee(tenantId, employeeId, status);
  return loans.map(toDTO);
}

export async function getEmployeeLoan(tenantId: string, id: string): Promise<EmployeeLoanDTO | null> {
  const repository = new PrismaEmployeeLoanRepository();
  const loan = await repository.findById(tenantId, id);
  return loan ? toDTO(loan) : null;
}

// Internal helper called FROM payroll-run processing (never exposed as a standalone service) —
// decrements `outstandingAmount` by `amount`, capped at the remaining balance (never goes
// negative), and flips to CLOSED when it hits zero. Must accept `tx` since it always runs inside
// the caller's payroll-run transaction. Returns the actual amount recovered (which may be less
// than the requested `amount` if it was capped), so the caller can use it for the payslip's own
// recovery-total bookkeeping.
export async function recoverLoanInstallment(
  tenantId: string,
  loan: EmployeeLoanEntity,
  amount: number,
  tx?: Prisma.TransactionClient
): Promise<{ loan: EmployeeLoanEntity; recovered: number }> {
  const recovered = Math.min(amount, loan.outstandingAmount);
  const newOutstanding = Math.round((loan.outstandingAmount - recovered) * 100) / 100;
  const newStatus: EmployeeLoanStatusValue = newOutstanding <= 0 ? "CLOSED" : "ACTIVE";

  const repository = new PrismaEmployeeLoanRepository();
  const updated = await repository.recordRecovery(tenantId, loan.id, Math.max(newOutstanding, 0), newStatus, tx);
  return { loan: updated, recovered };
}

// The exact inverse of recoverLoanInstallment — used by regeneratePayslip to undo a previously
// applied recovery before reapplying the freshly computed one. Outstanding amount is capped at
// principalAmount (never restored past the original principal).
export async function reverseLoanRecovery(
  tenantId: string,
  loan: EmployeeLoanEntity,
  amount: number,
  tx?: Prisma.TransactionClient
): Promise<EmployeeLoanEntity> {
  const restored = Math.min(loan.outstandingAmount + amount, loan.principalAmount);
  const newOutstanding = Math.round(restored * 100) / 100;
  const newStatus: EmployeeLoanStatusValue = newOutstanding > 0 ? "ACTIVE" : "CLOSED";

  const repository = new PrismaEmployeeLoanRepository();
  return repository.recordRecovery(tenantId, loan.id, newOutstanding, newStatus, tx);
}

export async function cancelEmployeeLoan(id: string, context: PayrollContext): Promise<EmployeeLoanDTO> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaEmployeeLoanRepository();
  const loan = await repository.findById(tenantId, id);
  if (!loan) throw new EmployeeLoanNotFoundError();

  if (loan.status !== "ACTIVE" || loan.outstandingAmount !== loan.principalAmount) {
    throw new LoanCannotBeCancelledError();
  }

  const cancelled = await repository.cancel(tenantId, id, actingUserId);

  await recordPayrollAudit({
    tenantId,
    actorId: actingUserId,
    action: "LOAN_CANCELLED",
    entityType: "EmployeeLoan",
    entityId: cancelled.id,
    beforeState: loan,
    afterState: cancelled,
  });

  return toDTO(cancelled);
}

export { toDTO as toEmployeeLoanDTO };
