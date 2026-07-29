export type MessageSenderRoleValue = "PARENT" | "TEACHER";

// Append-only within a thread — no edit/delete. `readAt` is this message's own read receipt,
// distinct from Notification.readAt (which tracks the notification alert, not the message body).
export interface MessageEntity {
  id: string;
  tenantId: string;
  threadId: string;
  senderUserProfileId: string;
  senderRole: MessageSenderRoleValue;
  body: string;
  sentAt: Date;
  readAt: Date | null;
}
