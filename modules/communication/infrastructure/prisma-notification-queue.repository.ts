import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { NotificationQueue as PrismaNotificationQueue, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateNotificationQueueInput,
  NotificationQueueRepository,
  UpdateNotificationQueueInput,
} from "../domain/notification-queue.repository";
import type { NotificationQueueEntity, NotificationQueueStatusValue } from "../domain/notification-queue.entity";

function toEntity(row: PrismaNotificationQueue): NotificationQueueEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    notificationId: row.notificationId,
    retryCount: row.retryCount,
    scheduledAt: row.scheduledAt,
    processedAt: row.processedAt,
    status: row.status as NotificationQueueStatusValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaNotificationQueueRepository implements NotificationQueueRepository {
  async findById(
    tenantId: string,
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationQueueEntity | null> {
    const row = await withTenantContext(
      tenantId,
      (client) => client.notificationQueue.findUnique({ where: { tenantId_id: { tenantId, id } } }),
      tx
    );
    return row ? toEntity(row) : null;
  }

  async findByNotificationId(
    tenantId: string,
    notificationId: string,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationQueueEntity | null> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.notificationQueue.findUnique({ where: { tenantId_notificationId: { tenantId, notificationId } } }),
      tx
    );
    return row ? toEntity(row) : null;
  }

  async findDue(tenantId: string, asOf: Date, tx?: Prisma.TransactionClient): Promise<NotificationQueueEntity[]> {
    const rows = await withTenantContext(
      tenantId,
      (client) =>
        client.notificationQueue.findMany({
          where: { tenantId, status: "PENDING", scheduledAt: { lte: asOf } },
          orderBy: { scheduledAt: "asc" },
        }),
      tx
    );
    return rows.map(toEntity);
  }

  async create(input: CreateNotificationQueueInput, tx?: Prisma.TransactionClient): Promise<NotificationQueueEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.notificationQueue.create({
          data: {
            tenantId: input.tenantId,
            notificationId: input.notificationId,
            scheduledAt: input.scheduledAt,
            status: input.status ?? "PENDING",
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateNotificationQueueInput,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationQueueEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.notificationQueue.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: input.status,
            retryCount: input.retryCount,
            scheduledAt: input.scheduledAt,
            processedAt: input.processedAt,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
