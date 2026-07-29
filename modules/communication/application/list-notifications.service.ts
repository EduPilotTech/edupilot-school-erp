import "server-only";
import { PrismaNotificationRepository } from "../infrastructure/prisma-notification.repository";
import type { NotificationEntity } from "../domain/notification.entity";

export async function listMyNotifications(tenantId: string, userProfileId: string): Promise<NotificationEntity[]> {
  const repository = new PrismaNotificationRepository();
  return repository.findByRecipient(tenantId, userProfileId);
}

export async function countUnreadNotifications(tenantId: string, userProfileId: string): Promise<number> {
  const repository = new PrismaNotificationRepository();
  return repository.countUnread(tenantId, userProfileId);
}
