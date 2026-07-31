import "server-only";
import { queryNotificationReport } from "../infrastructure/notification-reporting.queries";
import type { NotificationReportFilterInput, NotificationReportItemDTO } from "./dto/notification-reports.dto";

// Notifications with their delivery attempts joined in (Phase 15A Part 6). Read-only.
export async function getNotificationReport(
  tenantId: string,
  filter: NotificationReportFilterInput = {}
): Promise<NotificationReportItemDTO[]> {
  const rows = await queryNotificationReport(tenantId, filter);

  return rows.map((row) => ({
    id: row.id,
    recipientUserProfileId: row.recipientUserProfileId,
    type: row.type,
    priority: row.priority,
    title: row.title,
    body: row.body,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    deliveries: row.deliveries.map((delivery) => ({
      channel: delivery.channel,
      status: delivery.status,
      provider: delivery.provider,
      sentAt: delivery.sentAt ? delivery.sentAt.toISOString() : null,
      error: delivery.error,
    })),
  }));
}
