import type { NotificationTypeValue } from "@/modules/communication/domain/notification.entity";
import type { NotificationChannelValue } from "@/modules/communication/domain/notification-delivery.entity";
import type { NotificationDeliveryStatusValue } from "@/modules/communication/domain/notification-delivery.entity";
import type { NotificationQueueStatusValue } from "@/modules/communication/domain/notification-queue.entity";

// Human-readable labels for the 16 NotificationTypeValue values (Phase 15A spec), shared by the
// Compose form (app/notifications), Notification History (app/notification/history), and the
// Notification/Delivery/Failed reports — every page that needs to render or filter by
// NotificationType uses this single map rather than re-deriving labels per page.
export const NOTIFICATION_TYPE_LABELS: Record<NotificationTypeValue, string> = {
  ADMISSION_CONFIRMATION: "Admission Confirmation",
  FEE_DUE: "Fee Reminder",
  FEE_PAYMENT_SUCCESS: "Fee Payment Success",
  ATTENDANCE_ALERT: "Attendance Alert",
  HOMEWORK: "Homework Assigned",
  EXAM_SCHEDULE: "Exam Schedule",
  EXAM_RESULT: "Exam Result",
  HOLIDAY_NOTICE: "Holiday Notice",
  BIRTHDAY_WISHES: "Birthday Wishes",
  TRANSPORT_ALERT: "Transport Notice",
  HOSTEL_NOTICE: "Hostel Notice",
  LIBRARY_ALERT: "Library Alert",
  PAYROLL_ALERT: "Payroll Alert",
  NOTICE: "General Notice",
  MESSAGE: "Message",
  CALENDAR_EVENT: "Calendar Event",
};

export const NOTIFICATION_TYPE_OPTIONS: { value: NotificationTypeValue; label: string }[] = (
  Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationTypeValue[]
).map((value) => ({ value, label: NOTIFICATION_TYPE_LABELS[value] }));

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannelValue, string> = {
  IN_APP: "In-App",
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  PUSH: "Push",
};

export const NOTIFICATION_CHANNEL_OPTIONS: { value: NotificationChannelValue; label: string }[] = (
  Object.keys(NOTIFICATION_CHANNEL_LABELS) as NotificationChannelValue[]
).map((value) => ({ value, label: NOTIFICATION_CHANNEL_LABELS[value] }));

export const NOTIFICATION_PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export const NOTIFICATION_DELIVERY_STATUS_LABELS: Record<NotificationDeliveryStatusValue, string> = {
  PENDING: "Pending",
  SENT: "Sent",
  FAILED: "Failed",
  DELIVERED: "Delivered",
};

export const NOTIFICATION_DELIVERY_STATUS_OPTIONS: { value: NotificationDeliveryStatusValue; label: string }[] = (
  Object.keys(NOTIFICATION_DELIVERY_STATUS_LABELS) as NotificationDeliveryStatusValue[]
).map((value) => ({ value, label: NOTIFICATION_DELIVERY_STATUS_LABELS[value] }));

export const NOTIFICATION_QUEUE_STATUS_LABELS: Record<NotificationQueueStatusValue, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SENT: "Sent",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};
