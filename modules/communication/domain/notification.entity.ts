export type NotificationTypeValue =
  | "NOTICE"
  | "HOMEWORK"
  | "FEE_DUE"
  | "ATTENDANCE_ALERT"
  | "MESSAGE"
  | "EXAM_RESULT"
  | "CALENDAR_EVENT"
  | "TRANSPORT_ALERT"
  | "LIBRARY_ALERT"
  // Phase 13 — Leave Approved/Rejected, Salary Released, Document Generated. Reused for every
  // HR + Payroll notification since no separate HR_ALERT type was approved (see
  // prisma/schema.prisma's NotificationType enum comment).
  | "PAYROLL_ALERT"
  // Phase 15A — Communication Hub. Only the events with no existing equivalent above; Fee
  // Reminder/Attendance Alert/Homework Assigned/Exam Result/Transport Notice already map onto
  // FEE_DUE/ATTENDANCE_ALERT/HOMEWORK/EXAM_RESULT/TRANSPORT_ALERT and are reused as-is (see
  // prisma/schema.prisma's NotificationType enum comment, which this union must stay in sync
  // with — the Prisma enum already carries these six values from the Phase 15A migration).
  | "ADMISSION_CONFIRMATION"
  | "FEE_PAYMENT_SUCCESS"
  | "EXAM_SCHEDULE"
  | "HOLIDAY_NOTICE"
  | "BIRTHDAY_WISHES"
  | "HOSTEL_NOTICE";

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
