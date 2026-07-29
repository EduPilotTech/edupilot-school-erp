import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  NotificationChannelValue,
  NotificationDeliveryEntity,
  NotificationDeliveryStatusValue,
} from "./notification-delivery.entity";

export interface CreateNotificationDeliveryInput {
  tenantId: string;
  notificationId: string;
  channel: NotificationChannelValue;
  status?: NotificationDeliveryStatusValue;
  provider?: string | null;
  providerMessageId?: string | null;
  sentAt?: Date | null;
  error?: string | null;
}

export interface NotificationDeliveryRepository {
  findByNotification(tenantId: string, notificationId: string): Promise<NotificationDeliveryEntity[]>;
  create(input: CreateNotificationDeliveryInput, tx?: Prisma.TransactionClient): Promise<NotificationDeliveryEntity>;
}
