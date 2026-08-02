import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaPlatformAuditLogRepository } from "../infrastructure/prisma-platform-audit-log.repository";

export interface RecordPlatformAuditInput {
  tenantId?: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
}

const auditLogRepository = new PrismaPlatformAuditLogRepository();

// Thin wrapper so every mutating billing service writes its audit row the same way — mirrors
// modules/fees/application/fee-audit.helpers.ts's own pattern. Pass `tx` to make the audit write
// part of the same transaction as the mutation it records.
export async function recordPlatformAudit(input: RecordPlatformAuditInput, tx?: Prisma.TransactionClient): Promise<void> {
  await auditLogRepository.create(
    {
      tenantId: input.tenantId ?? null,
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
