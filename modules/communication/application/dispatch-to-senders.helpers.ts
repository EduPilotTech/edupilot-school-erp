import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaNotificationDeliveryRepository } from "../infrastructure/prisma-notification-delivery.repository";
import { getActiveNotificationSenders } from "../infrastructure/notification-sender-factory";
import type { NotificationDeliveryEntity } from "../domain/notification-delivery.entity";
import type { NotificationSendInput } from "../domain/notification-sender";

const deliveryRepository = new PrismaNotificationDeliveryRepository();

// The ONE place that loops over every enabled NotificationSender (via the Provider Factory,
// notification-sender-factory.ts) and writes one NotificationDelivery row per attempted channel.
// Factored out of dispatch-notification.helpers.ts in Phase 15A so that function (dispatching a
// freshly-created Notification) and notification-queue.service.ts's processQueueEntry
// (dispatching an already-existing, previously-queued Notification) share exactly this loop —
// never two independent copies of "loop over senders, write deliveries."
export async function dispatchToAllSenders(
  tenantId: string,
  notificationId: string,
  sendInput: Omit<NotificationSendInput, "tenantId">,
  tx?: Prisma.TransactionClient
): Promise<NotificationDeliveryEntity[]> {
  const senders = getActiveNotificationSenders();
  const deliveries: NotificationDeliveryEntity[] = [];

  for (const sender of senders) {
    const result = await sender.send({ ...sendInput, tenantId });
    const delivery = await deliveryRepository.create(
      {
        tenantId,
        notificationId,
        channel: sender.channel,
        status: result.status,
        providerMessageId: result.providerMessageId ?? null,
        sentAt: result.status === "SENT" ? new Date() : null,
        error: result.error ?? null,
      },
      tx
    );
    deliveries.push(delivery);
  }

  return deliveries;
}
