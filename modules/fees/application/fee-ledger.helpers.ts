import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaFeeLedgerEntryRepository } from "../infrastructure/prisma-fee-ledger-entry.repository";
import type { FeeLedgerEntryTypeValue } from "../domain/fee-ledger-entry.entity";

export interface AppendLedgerEntryInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  entryType: FeeLedgerEntryTypeValue;
  referenceType: string;
  referenceId: string;
  debit?: number;
  credit?: number;
  description: string;
  createdBy: string | null;
}

const ledgerRepository = new PrismaFeeLedgerEntryRepository();

// Appends one row to the student's running ledger (Phase 8 Decision 11 — append-only), computing
// `balanceAfter` from the latest known balance plus this entry's debit/credit. Debits (invoices,
// fines) increase what's owed; credits (payments, concessions) decrease it. Always pass `tx` when
// appending more than one entry for the same student within a single service call (e.g.
// collect-payment settling several invoices) so each `getLatestBalance` read sees the prior
// entries this same call already wrote.
export async function appendLedgerEntry(input: AppendLedgerEntryInput, tx?: Prisma.TransactionClient): Promise<void> {
  const latestBalance = await ledgerRepository.getLatestBalance(
    input.tenantId,
    input.studentId,
    input.academicSessionId,
    tx
  );
  const debit = input.debit ?? 0;
  const credit = input.credit ?? 0;
  const balanceAfter = Math.round((latestBalance + debit - credit) * 100) / 100;

  await ledgerRepository.create(
    {
      tenantId: input.tenantId,
      studentId: input.studentId,
      academicSessionId: input.academicSessionId,
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
