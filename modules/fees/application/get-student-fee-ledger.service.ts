import "server-only";
import { PrismaFeeLedgerEntryRepository } from "../infrastructure/prisma-fee-ledger-entry.repository";
import type { FeeLedgerEntryDTO } from "./dto/fee-ledger.dto";

// Student Fee Ledger (requirement 17) — a direct read of the append-only FeeLedgerEntry table
// (Decision 11), already in chronological order with a running balance; no recomputation here.
export async function getStudentFeeLedger(
  tenantId: string,
  studentId: string,
  academicSessionId: string
): Promise<FeeLedgerEntryDTO[]> {
  const repository = new PrismaFeeLedgerEntryRepository();
  const entries = await repository.findByStudent(tenantId, studentId, academicSessionId);
  return entries.map((entry) => ({
    id: entry.id,
    entryType: entry.entryType,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    debit: entry.debit,
    credit: entry.credit,
    balanceAfter: entry.balanceAfter,
    description: entry.description,
    createdAt: entry.createdAt.toISOString(),
  }));
}
