import type { NotificationChannelValue } from "./notification-delivery.entity";
import type { NotificationPriorityValue, NotificationTypeValue } from "./notification.entity";

export interface NotificationSendInput {
  // Added in a Phase 15A fix: a channel sender that needs to resolve the recipient's own contact
  // details (email/phone) must do so tenant-scoped, like every other lookup in this codebase
  // (docs/CODING_STANDARDS.md §6 — never trust an unscoped lookup, even when a primary key alone
  // would technically resolve the correct row). Callers of `dispatchToAllSenders` never construct
  // this field themselves — it injects `tenantId` (which it already receives as its own parameter)
  // before calling each sender, so this stays additive with no change to any producer.
  tenantId: string;
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
