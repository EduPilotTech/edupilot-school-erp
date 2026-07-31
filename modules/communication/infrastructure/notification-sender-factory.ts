import "server-only";
import { InAppNotificationSender } from "./in-app-notification.sender";
import { EmailNotificationSender } from "./email-notification.sender";
import { SmsNotificationSender } from "./sms-notification.sender";
import { WhatsAppNotificationSender } from "./whatsapp-notification.sender";
import { UnconfiguredEmailProvider } from "./unconfigured-email.provider";
import { UnconfiguredSmsProvider } from "./unconfigured-sms.provider";
import { UnconfiguredWhatsAppProvider } from "./unconfigured-whatsapp.provider";
import type { NotificationSender } from "../domain/notification-sender";

// Provider Factory (Phase 15A) — the single place that decides which concrete Provider backs each
// channel's NotificationSender. Swapping in a real SMTP/SMS-gateway/WhatsApp Business API
// integration later means changing the constructor call below, never touching a caller —
// dispatch-notification.helpers.ts and notification-queue.service.ts's processQueueEntry both only
// ever depend on this factory + the NotificationSender interface, exactly like
// InAppNotificationSender's own class comment already anticipated.
export function getActiveNotificationSenders(): NotificationSender[] {
  return [
    new InAppNotificationSender(),
    new EmailNotificationSender(new UnconfiguredEmailProvider()),
    new SmsNotificationSender(new UnconfiguredSmsProvider()),
    new WhatsAppNotificationSender(new UnconfiguredWhatsAppProvider()),
  ];
}
