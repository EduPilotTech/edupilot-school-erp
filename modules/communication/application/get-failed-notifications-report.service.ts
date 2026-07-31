import "server-only";
import { queryFailedNotificationsReport } from "../infrastructure/notification-reporting.queries";
import type { FailedNotificationReportItemDTO, FailedNotificationsReportFilterInput } from "./dto/notification-reports.dto";

// NotificationDelivery rows with status FAILED, with the parent Notification's title/recipient
// joined in (Phase 15A Part 6). Read-only.
export async function getFailedNotificationsReport(
  tenantId: string,
  filter: FailedNotificationsReportFilterInput = {}
): Promise<FailedNotificationReportItemDTO[]> {
  const rows = await queryFailedNotificationsReport(tenantId, filter);

  return rows.map((row) => ({
    deliveryId: row.deliveryId,
    notificationId: row.notificationId,
    channel: row.channel,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    notificationTitle: row.notificationTitle,
    recipientUserProfileId: row.recipientUserProfileId,
  }));
}
