import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaNotificationDeliveryRepository } from "../infrastructure/prisma-notification-delivery.repository";
import { getActiveNotificationSenders, getActiveProviderName } from "../infrastructure/notification-sender-factory";
import { logProviderFailure } from "./log-provider-failure.helpers";
import type { NotificationDeliveryEntity } from "../domain/notification-delivery.entity";
import type { NotificationSendInput } from "../domain/notification-sender";

const deliveryRepository = new PrismaNotificationDeliveryRepository();

// The ONE place that loops over every enabled NotificationSender (via the Provider Factory,
// notification-sender-factory.ts) and writes one NotificationDelivery row per attempted channel.
// Factored out of dispatch-notification.helpers.ts in Phase 15A so that function (dispatching a
// freshly-created Notification) and notification-queue.service.ts's processQueueEntry
// (dispatching an already-existing, previously-queued Notification) share exactly this loop —
// never two independent copies of "loop over senders, write deliveries."
//
// Phase 15B Milestones M8/M9 addition: on a FAILED result, calls logProviderFailure() (Milestone
// M3) here — the one place that genuinely holds both tenantId AND notificationId for every
// channel's attempt, which no individual Provider implementation can know on its own (see
// smtp-email.provider.ts's own comment on why that context can't honestly reach the provider
// layer without changing a frozen interface). Wiring it in once, here, means every current and
// future provider/channel gets secure server-side failure logging for free, without duplicating
// the call inside each one.
//
// Phase 15B Milestone M12 addition: the logged `provider` field now uses
// getActiveProviderName(channel) (the Provider Registry's own resolution, e.g. "smtp") instead of
// a generic channel-derived guess — closing a simplification Milestone M8's own report flagged.
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

    if (result.status === "FAILED") {
      logProviderFailure({
        channel: sender.channel,
        tenantId,
        notificationId,
        provider: getActiveProviderName(sender.channel),
        rawError: result.error,
      });
    }

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
