export type NotificationTypeValue =
  | "NOTICE"
  | "HOMEWORK"
  | "FEE_DUE"
  | "ATTENDANCE_ALERT"
  | "MESSAGE"
  | "EXAM_RESULT"
  | "CALENDAR_EVENT";

export type NotificationPriorityValue = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// The channel-agnostic fact ("this happened, this user should know") — every producer writes
// exactly one row here regardless of how many channels eventually deliver it. `readAt` is Push
// Notification Read Status (requirement 19) — no separate model, "read" is a property of the
// notification record itself. `priority` (requirement 10) lets a consumer sort/filter urgency.
export interface NotificationEntity {
  id: string;
  tenantId: string;
  recipientUserProfileId: string;
  type: NotificationTypeValue;
  priority: NotificationPriorityValue;
  title: string;
  body: string;
  referenceType: string | null;
  referenceId: string | null;
  readAt: Date | null;
  createdAt: Date;
}
