import "server-only";
import { queryDeliveryReport } from "../infrastructure/notification-reporting.queries";
import type { DeliveryReportDTO, DeliveryReportFilterInput } from "./dto/notification-reports.dto";

// NotificationDelivery rows with channel/status/provider/error, plus counts by status (Phase 15A
// Part 6). Read-only. See notification-reporting.queries.ts's own comment for the
// `countsByStatus` vs. `items` filtering distinction.
export async function getDeliveryReport(
  tenantId: string,
  filter: DeliveryReportFilterInput = {}
): Promise<DeliveryReportDTO> {
  const result = await queryDeliveryReport(tenantId, filter);

  return {
    items: result.items.map((row) => ({
      id: row.id,
      notificationId: row.notificationId,
      channel: row.channel,
      status: row.status,
      provider: row.provider,
      providerMessageId: row.providerMessageId,
      sentAt: row.sentAt ? row.sentAt.toISOString() : null,
      error: row.error,
      createdAt: row.createdAt.toISOString(),
    })),
    countsByStatus: result.countsByStatus,
  };
}
