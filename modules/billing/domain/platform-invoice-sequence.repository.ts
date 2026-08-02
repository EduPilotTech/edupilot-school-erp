import type { Prisma } from "@/lib/generated/prisma/client";
import type { PlatformInvoiceSequenceEntity } from "./platform-invoice-sequence.entity";

// Mirrors FeeNumberSequenceRepository exactly, minus the tenantId/type dimensions — this counter
// is scoped only by financial year. `nextNumber` MUST be called with a `tx` the caller already
// opened (SubscriptionInvoice creation) so the increment and the row it numbers commit or fail
// together.
export interface PlatformInvoiceSequenceRepository {
  findByFinancialYear(financialYear: string): Promise<PlatformInvoiceSequenceEntity | null>;

  // Atomically increments (creating the row at 0 -> 1 on first use) and returns the formatted
  // number (`prefix` + zero-padded `lastNumber`).
  nextNumber(financialYear: string, tx: Prisma.TransactionClient): Promise<string>;

  // Sets the prefix without touching `lastNumber` — creates the sequence row (at 0) if it
  // doesn't exist yet.
  configurePrefix(financialYear: string, prefix: string, updatedBy: string | null): Promise<PlatformInvoiceSequenceEntity>;
}
