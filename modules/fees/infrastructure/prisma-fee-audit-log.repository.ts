import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, FeeAuditLog as PrismaFeeAuditLog } from "@/lib/generated/prisma/client";
import type { CreateFeeAuditLogInput, FeeAuditLogRepository } from "../domain/fee-audit-log.repository";
import type { FeeAuditLogEntity } from "../domain/fee-audit-log.entity";

function toEntity(row: PrismaFeeAuditLog): FeeAuditLogEntity {
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

export class PrismaFeeAuditLogRepository implements FeeAuditLogRepository {
  async findByEntity(tenantId: string, entityType: string, entityId: string): Promise<FeeAuditLogEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeAuditLog.findMany({ where: { tenantId, entityType, entityId }, orderBy: { createdAt: "desc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateFeeAuditLogInput, tx?: Prisma.TransactionClient): Promise<FeeAuditLogEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.feeAuditLog.create({
          data: {
            tenantId: input.tenantId,
            actorId: input.actorId ?? null,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            beforeState: input.beforeState === undefined ? undefined : (input.beforeState as Prisma.InputJsonValue),
            afterState: input.afterState === undefined ? undefined : (input.afterState as Prisma.InputJsonValue),
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
