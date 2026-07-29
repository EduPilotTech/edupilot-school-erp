import "server-only";
import type { NotificationSendInput, NotificationSendResult, NotificationSender } from "../domain/notification-sender";

// The only NotificationSender actually wired up this phase. "Sending" an in-app notification has
// no external call to make — the Notification row itself (already created by the caller before
// this runs) IS the delivery; this sender exists only so dispatch-notification.service.ts can
// treat every channel uniformly through the same NotificationSender interface, with Email/SMS/
// WhatsApp/Push implementations dropping in later without touching that caller.
export class InAppNotificationSender implements NotificationSender {
  readonly channel = "IN_APP" as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the NotificationSender interface; this sender has no external call to make (see class comment).
  async send(input: NotificationSendInput): Promise<NotificationSendResult> {
    return { status: "SENT" };
  }
}
