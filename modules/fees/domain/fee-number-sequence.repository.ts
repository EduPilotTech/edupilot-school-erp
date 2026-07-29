import type { Prisma } from "@/lib/generated/prisma/client";
import type { FeeNumberSequenceEntity, FeeNumberSequenceTypeValue } from "./fee-number-sequence.entity";

// Independent Invoice/Receipt sequencing with a per-tenant-per-session configurable prefix
// (Phase 8 requirement 9). `nextNumber` MUST be called with a `tx` the caller already opened
// (invoice/payment creation) so the increment and the row it numbers commit or fail together —
// unlike every other repository method's optional `tx?`, this one is mandatory, since calling it
// outside a transaction would let a number be consumed without the row it was meant for ever
// being created.
export interface FeeNumberSequenceRepository {
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<FeeNumberSequenceEntity[]>;

  // Atomically increments (creating the row at 0 -> 1 on first use) and returns the formatted
  // number (`prefix` + zero-padded `lastNumber`). Implemented as a single Postgres
  // `INSERT ... ON CONFLICT DO UPDATE` (via Prisma's `upsert`), which is atomic and row-locking —
  // no separate advisory lock needed to serialize concurrent cashiers.
  nextNumber(
    tenantId: string,
    academicSessionId: string,
    type: FeeNumberSequenceTypeValue,
    tx: Prisma.TransactionClient
  ): Promise<string>;

  // Sets the prefix without touching `lastNumber` — creates the sequence row (at 0) if it
  // doesn't exist yet, so an admin can configure a prefix before the first invoice/receipt is
  // ever generated.
  configurePrefix(
    tenantId: string,
    academicSessionId: string,
    type: FeeNumberSequenceTypeValue,
    prefix: string,
    updatedBy: string | null
  ): Promise<FeeNumberSequenceEntity>;
}
