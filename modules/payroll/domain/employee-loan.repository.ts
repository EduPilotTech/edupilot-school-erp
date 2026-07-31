import type { Prisma } from "@/lib/generated/prisma/client";
import type { EmployeeLoanEntity, EmployeeLoanStatusValue, EmployeeLoanTypeValue } from "./employee-loan.entity";

export interface CreateEmployeeLoanInput {
  tenantId: string;
  employeeId: string;
  loanType: EmployeeLoanTypeValue;
  principalAmount: number;
  monthlyRecoveryAmount: number;
  startDate: Date;
  reason?: string | null;
  createdBy?: string | null;
}

export interface EmployeeLoanRepository {
  findById(tenantId: string, id: string): Promise<EmployeeLoanEntity | null>;
  findByEmployee(tenantId: string, employeeId: string, status?: EmployeeLoanStatusValue): Promise<EmployeeLoanEntity[]>;
  // Every ACTIVE loan for an employee, scoped for the payroll-run recovery step — same shape as
  // findByEmployee(tenantId, employeeId, "ACTIVE") but named for that specific call site's intent.
  findActiveByEmployee(tenantId: string, employeeId: string, tx?: Prisma.TransactionClient): Promise<EmployeeLoanEntity[]>;
  create(input: CreateEmployeeLoanInput, tx?: Prisma.TransactionClient): Promise<EmployeeLoanEntity>;
  // The recovery-step mutation: decrements `outstandingAmount`, flips to CLOSED when it hits zero.
  // Must accept `tx` — called from inside the payroll-run transaction.
  recordRecovery(
    tenantId: string,
    id: string,
    newOutstandingAmount: number,
    newStatus: EmployeeLoanStatusValue,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeLoanEntity>;
  cancel(tenantId: string, id: string, updatedBy: string | null, tx?: Prisma.TransactionClient): Promise<EmployeeLoanEntity>;
}
