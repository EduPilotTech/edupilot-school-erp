import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Notification as PrismaNotification } from "@/lib/generated/prisma/client";
import type { CreateNotificationInput, NotificationRepository } from "../domain/notification.repository";
import type { NotificationEntity, NotificationPriorityValue, NotificationTypeValue } from "../domain/notification.entity";

const DEFAULT_LIMIT = 50;

function toEntity(row: PrismaNotification): NotificationEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    recipientUserProfileId: row.recipientUserProfileId,
    type: row.type as NotificationTypeValue,
    priority: row.priority as NotificationPriorityValue,
    title: row.title,
    body: row.body,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  async findById(tenantId: string, id: string): Promise<NotificationEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.notification.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByRecipient(
    tenantId: string,
    recipientUserProfileId: string,
    limit: number = DEFAULT_LIMIT
  ): Promise<NotificationEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.notification.findMany({
        where: { tenantId, recipientUserProfileId },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    );
    return rows.map(toEntity);
  }

  async countUnread(tenantId: string, recipientUserProfileId: string): Promise<number> {
    return withTenantContext(tenantId, (tx) =>
      tx.notification.count({ where: { tenantId, recipientUserProfileId, readAt: null } })
    );
  }

  async create(input: CreateNotificationInput, tx?: Prisma.TransactionClient): Promise<NotificationEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.notification.create({
          data: {
            tenantId: input.tenantId,
            recipientUserProfileId: input.recipientUserProfileId,
            type: input.type,
            priority: input.priority ?? "NORMAL",
            title: input.title,
            body: input.body,
            referenceType: input.referenceType ?? null,
            referenceId: input.referenceId ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async markRead(tenantId: string, id: string, tx?: Prisma.TransactionClient): Promise<NotificationEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.notification.update({
          where: { tenantId_id: { tenantId, id } },
          data: { readAt: new Date() },
        }),
      tx
    );
    return toEntity(row);
  }
}
