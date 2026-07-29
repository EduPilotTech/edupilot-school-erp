import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaFeeAuditLogRepository } from "../infrastructure/prisma-fee-audit-log.repository";

export interface RecordFeeAuditInput {
  tenantId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
}

const auditLogRepository = new PrismaFeeAuditLogRepository();

// Thin wrapper so every mutating fee service writes its audit row the same way (Phase 8
// Decision 6). Pass `tx` to make the audit write part of the same transaction as the mutation it
// records — see fee-audit-log.repository.ts's own comment for why this module deliberately
// diverges from docs/SECURITY_GUIDELINES.md §7's general non-blocking guidance.
export async function recordFeeAudit(input: RecordFeeAuditInput, tx?: Prisma.TransactionClient): Promise<void> {
  await auditLogRepository.create(
    {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeState: input.beforeState,
      afterState: input.afterState,
    },
    tx
  );
}
