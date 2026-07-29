import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaNotificationRepository } from "../infrastructure/prisma-notification.repository";
import { PrismaNotificationDeliveryRepository } from "../infrastructure/prisma-notification-delivery.repository";
import { InAppNotificationSender } from "../infrastructure/in-app-notification.sender";
import type { NotificationPriorityValue, NotificationTypeValue } from "../domain/notification.entity";

export interface DispatchNotificationInput {
  tenantId: string;
  recipientUserProfileId: string;
  type: NotificationTypeValue;
  priority?: NotificationPriorityValue;
  title: string;
  body: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

const notificationRepository = new PrismaNotificationRepository();
const deliveryRepository = new PrismaNotificationDeliveryRepository();
const inAppSender = new InAppNotificationSender();

// Creates the channel-agnostic Notification record and dispatches it through every enabled
// NotificationSender — only IN_APP is wired up this phase. Every producer (Notice published,
// Homework assigned, Message sent) calls this one helper; adding a real Email/SMS/WhatsApp/Push
// sender later means adding it to the loop below, never touching a caller.
export async function dispatchNotification(
  input: DispatchNotificationInput,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const notification = await notificationRepository.create(
    {
      tenantId: input.tenantId,
      recipientUserProfileId: input.recipientUserProfileId,
      type: input.type,
      priority: input.priority,
      title: input.title,
      body: input.body,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
    },
    tx
  );

  const senders = [inAppSender];

  for (const sender of senders) {
    const result = await sender.send({
      recipientUserProfileId: input.recipientUserProfileId,
      type: input.type,
      priority: input.priority ?? "NORMAL",
      title: input.title,
      body: input.body,
    });

    await deliveryRepository.create(
      {
        tenantId: input.tenantId,
        notificationId: notification.id,
        channel: sender.channel,
        status: result.status,
        sentAt: result.status === "SENT" ? new Date() : null,
        error: result.error ?? null,
      },
      tx
    );
  }
}
