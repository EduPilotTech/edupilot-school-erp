import { z } from "zod";

// Hand-matched against NotificationType/NotificationPriority's runtime values, same "duplicate the
// literal union in the zod schema rather than import the Prisma enum" precedent notice.dto.ts
// already established for NoticeAudienceValue.
const notificationTypeValues = [
  "NOTICE",
  "HOMEWORK",
  "FEE_DUE",
  "ATTENDANCE_ALERT",
  "MESSAGE",
  "EXAM_RESULT",
  "CALENDAR_EVENT",
  "TRANSPORT_ALERT",
  "LIBRARY_ALERT",
  "PAYROLL_ALERT",
  "ADMISSION_CONFIRMATION",
  "FEE_PAYMENT_SUCCESS",
  "EXAM_SCHEDULE",
  "HOLIDAY_NOTICE",
  "BIRTHDAY_WISHES",
  "HOSTEL_NOTICE",
] as const;

const notificationPriorityValues = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

// Either `templateId` (+ optional `variables` to render it) OR both `title` and `body` must be
// supplied — enforced by the `.refine()` below, then re-checked (after template rendering) inside
// notification-queue.service.ts's `queueNotification` itself, since a template's rendered output
// could theoretically still be empty.
export const queueNotificationSchema = z
  .object({
    recipientUserProfileId: z.string().uuid("Recipient is required."),
    type: z.enum(notificationTypeValues),
    priority: z.enum(notificationPriorityValues).optional(),
    templateId: z.string().uuid().optional(),
    variables: z.record(z.string(), z.string()).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(10000).optional(),
    referenceType: z.string().trim().max(100).optional(),
    referenceId: z.string().uuid().optional(),
    scheduledAt: z.coerce.date().optional(),
  })
  .refine((data) => Boolean(data.templateId) || Boolean(data.title && data.body), {
    message: "Either a templateId (with variables) or both title and body must be supplied.",
  });
export type QueueNotificationServiceInput = z.infer<typeof queueNotificationSchema>;

// No separate response DTO here — queueNotification/sendNotificationNow/scheduleNotification
// return the domain NotificationEntity + NotificationQueueEntity directly, mirroring this same
// module's own pre-existing list-notifications.service.ts (`listMyNotifications` returns
// `NotificationEntity[]`, not a hand-rolled DTO). A Server Action layer (out of scope this pass)
// is where date-to-ISO-string DTO conversion would happen, same as everywhere else in this
// codebase.
