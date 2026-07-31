import type { Prisma } from "@/lib/generated/prisma/client";
import type { NotificationQueueEntity, NotificationQueueStatusValue } from "./notification-queue.entity";

export interface CreateNotificationQueueInput {
  tenantId: string;
  notificationId: string;
  scheduledAt: Date;
  status?: NotificationQueueStatusValue;
}

export interface UpdateNotificationQueueInput {
  status?: NotificationQueueStatusValue;
  retryCount?: number;
  scheduledAt?: Date;
  processedAt?: Date | null;
}

export interface NotificationQueueRepository {
  findById(tenantId: string, id: string, tx?: Prisma.TransactionClient): Promise<NotificationQueueEntity | null>;
  findByNotificationId(
    tenantId: string,
    notificationId: string,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationQueueEntity | null>;
  // Backs the queue processor (`processDueNotificationQueue`) — every PENDING row whose
  // `scheduledAt` has arrived, for one tenant.
  findDue(tenantId: string, asOf: Date, tx?: Prisma.TransactionClient): Promise<NotificationQueueEntity[]>;

  create(input: CreateNotificationQueueInput, tx?: Prisma.TransactionClient): Promise<NotificationQueueEntity>;
  update(
    tenantId: string,
    id: string,
    input: UpdateNotificationQueueInput,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationQueueEntity>;
}
