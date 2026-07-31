export type NotificationQueueStatusValue = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED";

// Genuinely new this phase (Phase 15A) — a scheduling/retry wrapper around one `Notification`.
// One row per Notification (see `@@unique([tenantId, notificationId])` on the Prisma model), NOT
// one row per channel-attempt — that is `NotificationDelivery`'s job, unchanged. This is what
// makes `schedule()`/`retry()`/`cancel()` meaningful: a Notification can be created now but its
// actual dispatch deferred to `scheduledAt`, and a failed dispatch retried with an incremented
// `retryCount` without ever creating a second Notification for the same logical message.
export interface NotificationQueueEntity {
  id: string;
  tenantId: string;
  notificationId: string;
  retryCount: number;
  scheduledAt: Date;
  processedAt: Date | null;
  status: NotificationQueueStatusValue;
  createdAt: Date;
  updatedAt: Date;
}
