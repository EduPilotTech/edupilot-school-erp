import type { Prisma } from "@/lib/generated/prisma/client";
import type { FeeLedgerEntryEntity, FeeLedgerEntryTypeValue } from "./fee-ledger-entry.entity";

export interface CreateFeeLedgerEntryInput {
  tenantId: string;
  studentId: string;
  academicSessionId: string;
  entryType: FeeLedgerEntryTypeValue;
  referenceType: string;
  referenceId: string;
  debit?: number;
  credit?: number;
  balanceAfter: number;
  description: string;
  createdBy?: string | null;
}

// A pure, append-only running ledger per student (Phase 8 Decision 11) — this interface
// intentionally exposes no update or delete method, the same structural discipline as
// EnrollmentRepository's create/close-only shape: "never rewrite ledger history" is enforced by
// what this interface makes possible to call, not just documented.
export interface FeeLedgerEntryRepository {
  findByStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<FeeLedgerEntryEntity[]>;
  // The running balance as of the most recent entry — lets a writing service compute the next
  // entry's `balanceAfter` without re-summing the whole history. Accepts an optional `tx` so a
  // caller appending more than one entry within the same transaction (e.g. a payment credit plus
  // a fine debit) sees its own prior, still-uncommitted writes rather than a stale balance read
  // from a separate connection.
  getLatestBalance(
    tenantId: string,
    studentId: string,
    academicSessionId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number>;
  create(input: CreateFeeLedgerEntryInput, tx?: Prisma.TransactionClient): Promise<FeeLedgerEntryEntity>;
}
