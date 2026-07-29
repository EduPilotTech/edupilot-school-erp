export type NotificationChannelValue = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
export type NotificationDeliveryStatusValue = "PENDING" | "SENT" | "FAILED" | "DELIVERED";

// One row per (notification, channel) attempted — the entire answer to "support Email/WhatsApp/
// Push/SMS in future without redesign." Only IN_APP is dispatched this phase; every other
// channel value is reserved, unused.
export interface NotificationDeliveryEntity {
  id: string;
  tenantId: string;
  notificationId: string;
  channel: NotificationChannelValue;
  status: NotificationDeliveryStatusValue;
  provider: string | null;
  providerMessageId: string | null;
  sentAt: Date | null;
  error: string | null;
  createdAt: Date;
}
