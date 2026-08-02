import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, PlatformAuditLog as PrismaPlatformAuditLog } from "@/lib/generated/prisma/client";
import type { CreatePlatformAuditLogInput, PlatformAuditLogRepository } from "../domain/platform-audit-log.repository";
import type { PlatformAuditLogEntity } from "../domain/platform-audit-log.entity";

// Platform-ops tier — direct `prisma` client, `tenantId` nullable (the one hybrid audit log in
// this codebase). Mirrors prisma-fee-audit-log.repository.ts field-for-field otherwise.
export function toEntity(row: PrismaPlatformAuditLog): PlatformAuditLogEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    actorId: row.actorId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    beforeState: row.beforeState,
    afterState: row.afterState,
    createdAt: row.createdAt,
  };
}

export class PrismaPlatformAuditLogRepository implements PlatformAuditLogRepository {
  async findByEntity(entityType: string, entityId: string): Promise<PlatformAuditLogEntity[]> {
    const rows = await prisma.platformAuditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toEntity);
  }

  async create(input: CreatePlatformAuditLogInput, tx?: Prisma.TransactionClient): Promise<PlatformAuditLogEntity> {
    const client = tx ?? prisma;
    const row = await client.platformAuditLog.create({
      data: {
        tenantId: input.tenantId ?? null,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeState: input.beforeState as Prisma.InputJsonValue | undefined,
        afterState: input.afterState as Prisma.InputJsonValue | undefined,
      },
    });
    return toEntity(row);
  }
}
