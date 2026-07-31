import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaPayrollLedgerEntryRepository } from "../infrastructure/prisma-payroll-ledger-entry.repository";
import type { PayrollLedgerEntryEntity, PayrollLedgerEntryTypeValue } from "../domain/payroll-ledger-entry.entity";

export interface AppendPayrollLedgerEntryInput {
  tenantId: string;
  employeeId: string;
  entryType: PayrollLedgerEntryTypeValue;
  referenceType: string;
  referenceId: string;
  debit?: number;
  credit?: number;
  description: string;
  createdBy: string | null;
}

const ledgerRepository = new PrismaPayrollLedgerEntryRepository();

// Exactly mirrors modules/fees/application/fee-ledger.helpers.ts's `appendLedgerEntry`, scoped
// per-employeeId instead of per-studentId (no academicSessionId dimension — payroll has no
// session concept). Debits (payments) reduce what the school owes; credits (payslips generated)
// increase it — the reverse sense from Fee's own student-owes-school direction.
export async function appendPayrollLedgerEntry(
  input: AppendPayrollLedgerEntryInput,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const latestBalance = await ledgerRepository.getLatestBalance(input.tenantId, input.employeeId, tx);
  const debit = input.debit ?? 0;
  const credit = input.credit ?? 0;
  const balanceAfter = Math.round((latestBalance + credit - debit) * 100) / 100;

  await ledgerRepository.create(
    {
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      entryType: input.entryType,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      debit,
      credit,
      balanceAfter,
      description: input.description,
      createdBy: input.createdBy,
    },
    tx
  );
}

export async function getEmployeeLedger(tenantId: string, employeeId: string): Promise<PayrollLedgerEntryEntity[]> {
  return ledgerRepository.findByEmployee(tenantId, employeeId);
}
