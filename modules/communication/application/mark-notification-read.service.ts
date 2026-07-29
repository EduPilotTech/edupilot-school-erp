import "server-only";
import { PrismaNotificationRepository } from "../infrastructure/prisma-notification.repository";
import { NotificationNotFoundError } from "../domain/errors";
import type { NotificationEntity } from "../domain/notification.entity";

// Push Notification Read Status (requirement 19) — also enforces that a recipient can only mark
// their OWN notifications read (row-level scoping RBAC alone can't express).
export async function markNotificationRead(
  tenantId: string,
  notificationId: string,
  userProfileId: string
): Promise<NotificationEntity> {
  const repository = new PrismaNotificationRepository();
  const notification = await repository.findById(tenantId, notificationId);
  if (!notification || notification.recipientUserProfileId !== userProfileId) {
    throw new NotificationNotFoundError();
  }
  if (notification.readAt) {
    return notification;
  }
  return repository.markRead(tenantId, notificationId);
}
