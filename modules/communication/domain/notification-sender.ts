import type { NotificationChannelValue } from "./notification-delivery.entity";
import type { NotificationPriorityValue, NotificationTypeValue } from "./notification.entity";

export interface NotificationSendInput {
  recipientUserProfileId: string;
  type: NotificationTypeValue;
  priority: NotificationPriorityValue;
  title: string;
  body: string;
}

export interface NotificationSendResult {
  status: "SENT" | "FAILED";
  providerMessageId?: string;
  error?: string;
}

// One interface, swappable providers — the same shape as lib/storage/storage-service.ts's
// StorageService abstraction, applied to notification dispatch. Adding a real Email/SMS/
// WhatsApp/Push provider later means implementing this interface once; no schema change, no
// change to any producer's calling code (dispatch-notification.service.ts only ever depends on
// this interface, never a concrete provider).
export interface NotificationSender {
  readonly channel: NotificationChannelValue;
  send(input: NotificationSendInput): Promise<NotificationSendResult>;
}
