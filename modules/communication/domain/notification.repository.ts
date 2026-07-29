import type { Prisma } from "@/lib/generated/prisma/client";
import type { NotificationEntity, NotificationPriorityValue, NotificationTypeValue } from "./notification.entity";

export interface CreateNotificationInput {
  tenantId: string;
  recipientUserProfileId: string;
  type: NotificationTypeValue;
  priority?: NotificationPriorityValue;
  title: string;
  body: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

export interface NotificationRepository {
  findById(tenantId: string, id: string): Promise<NotificationEntity | null>;
  findByRecipient(tenantId: string, recipientUserProfileId: string, limit?: number): Promise<NotificationEntity[]>;
  countUnread(tenantId: string, recipientUserProfileId: string): Promise<number>;

  create(input: CreateNotificationInput, tx?: Prisma.TransactionClient): Promise<NotificationEntity>;
  markRead(tenantId: string, id: string, tx?: Prisma.TransactionClient): Promise<NotificationEntity>;
}
