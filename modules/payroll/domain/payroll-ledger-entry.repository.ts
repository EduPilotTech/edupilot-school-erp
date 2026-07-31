import type { Prisma } from "@/lib/generated/prisma/client";
import type { PayrollLedgerEntryEntity, PayrollLedgerEntryTypeValue } from "./payroll-ledger-entry.entity";

export interface CreatePayrollLedgerEntryInput {
  tenantId: string;
  employeeId: string;
  entryType: PayrollLedgerEntryTypeValue;
  referenceType: string;
  referenceId: string;
  debit?: number;
  credit?: number;
  balanceAfter: number;
  description: string;
  createdBy?: string | null;
}

// A pure, append-only running ledger per employee — this interface intentionally exposes no
// update or delete method, mirroring FeeLedgerEntryRepository's own discipline.
export interface PayrollLedgerEntryRepository {
  findByEmployee(tenantId: string, employeeId: string): Promise<PayrollLedgerEntryEntity[]>;
  // The running balance as of the most recent entry — lets a writing service compute the next
  // entry's `balanceAfter` without re-summing the whole history. Accepts an optional `tx` so a
  // caller appending more than one entry within the same transaction sees its own prior,
  // still-uncommitted writes rather than a stale balance read from a separate connection.
  getLatestBalance(tenantId: string, employeeId: string, tx?: Prisma.TransactionClient): Promise<number>;
  create(input: CreatePayrollLedgerEntryInput, tx?: Prisma.TransactionClient): Promise<PayrollLedgerEntryEntity>;
}
