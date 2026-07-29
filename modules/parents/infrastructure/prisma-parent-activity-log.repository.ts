import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, ParentActivityLog as PrismaParentActivityLog } from "@/lib/generated/prisma/client";
import type {
  CreateParentActivityLogInput,
  ParentActivityLogRepository,
} from "../domain/parent-activity-log.repository";
import type { ParentActivityLogEntity } from "../domain/parent-activity-log.entity";

function toEntity(row: PrismaParentActivityLog): ParentActivityLogEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    guardianId: row.guardianId,
    userProfileId: row.userProfileId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  };
}

const DEFAULT_LIMIT = 100;

export class PrismaParentActivityLogRepository implements ParentActivityLogRepository {
  async findByGuardian(
    tenantId: string,
    guardianId: string,
    limit: number = DEFAULT_LIMIT
  ): Promise<ParentActivityLogEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.parentActivityLog.findMany({
        where: { tenantId, guardianId },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    );
    return rows.map(toEntity);
  }

  async create(
    input: CreateParentActivityLogInput,
    tx?: Prisma.TransactionClient
  ): Promise<ParentActivityLogEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.parentActivityLog.create({
          data: {
            tenantId: input.tenantId,
            guardianId: input.guardianId,
            userProfileId: input.userProfileId,
            action: input.action,
            entityType: input.entityType ?? null,
            entityId: input.entityId ?? null,
            ipAddress: input.ipAddress ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
