import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaNotificationRepository } from "../infrastructure/prisma-notification.repository";
import { dispatchToAllSenders } from "./dispatch-to-senders.helpers";
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

// Creates the channel-agnostic Notification record and dispatches it through every enabled
// NotificationSender — resolved via the Provider Factory (getActiveNotificationSenders(), Phase
// 15A). Every producer (Notice published, Homework assigned, Message sent) calls this one helper;
// adding a real Email/SMS/WhatsApp/Push sender later means changing the factory, never touching a
// caller here.
//
// Phase 15A refactor: the actual "loop over senders, write NotificationDelivery rows" logic used
// to live inline in this function. It has been extracted into dispatch-to-senders.helpers.ts's
// `dispatchToAllSenders` so that notification-queue.service.ts's `processQueueEntry` — which
// dispatches an already-existing Notification rather than creating a new one — can share the exact
// same loop instead of duplicating it. This function's own job is now only "create the
// Notification, then hand off to that shared loop."
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

  await dispatchToAllSenders(
    input.tenantId,
    notification.id,
    {
      recipientUserProfileId: input.recipientUserProfileId,
      type: input.type,
      priority: input.priority ?? "NORMAL",
      title: input.title,
      body: input.body,
    },
    tx
  );
}
