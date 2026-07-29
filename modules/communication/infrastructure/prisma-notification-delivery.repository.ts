import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, NotificationDelivery as PrismaNotificationDelivery } from "@/lib/generated/prisma/client";
import type {
  CreateNotificationDeliveryInput,
  NotificationDeliveryRepository,
} from "../domain/notification-delivery.repository";
import type {
  NotificationChannelValue,
  NotificationDeliveryEntity,
  NotificationDeliveryStatusValue,
} from "../domain/notification-delivery.entity";

function toEntity(row: PrismaNotificationDelivery): NotificationDeliveryEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    notificationId: row.notificationId,
    channel: row.channel as NotificationChannelValue,
    status: row.status as NotificationDeliveryStatusValue,
    provider: row.provider,
    providerMessageId: row.providerMessageId,
    sentAt: row.sentAt,
    error: row.error,
    createdAt: row.createdAt,
  };
}

export class PrismaNotificationDeliveryRepository implements NotificationDeliveryRepository {
  async findByNotification(tenantId: string, notificationId: string): Promise<NotificationDeliveryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.notificationDelivery.findMany({ where: { tenantId, notificationId } })
    );
    return rows.map(toEntity);
  }

  async create(
    input: CreateNotificationDeliveryInput,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationDeliveryEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.notificationDelivery.create({
          data: {
            tenantId: input.tenantId,
            notificationId: input.notificationId,
            channel: input.channel,
            status: input.status ?? "PENDING",
            provider: input.provider ?? null,
            providerMessageId: input.providerMessageId ?? null,
            sentAt: input.sentAt ?? null,
            error: input.error ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
