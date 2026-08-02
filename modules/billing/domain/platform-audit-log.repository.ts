import type { Prisma } from "@/lib/generated/prisma/client";
import type { PlatformAuditLogEntity } from "./platform-audit-log.entity";

export interface CreatePlatformAuditLogInput {
  tenantId?: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
}

// Platform-ops tier. `findByEntity` deliberately has no tenantId parameter — unlike
// FeeAuditLogRepository.findByEntity, this log's `tenantId` is nullable and many rows (catalog
// edits, billing-run locks) have none at all, so lookups are always by entityType+entityId only.
export interface PlatformAuditLogRepository {
  findByEntity(entityType: string, entityId: string): Promise<PlatformAuditLogEntity[]>;
  create(input: CreatePlatformAuditLogInput, tx?: Prisma.TransactionClient): Promise<PlatformAuditLogEntity>;
}
