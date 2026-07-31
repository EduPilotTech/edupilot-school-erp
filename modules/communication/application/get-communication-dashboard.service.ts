import "server-only";
import { queryCommunicationDashboardCounts } from "../infrastructure/notification-reporting.queries";
import type { CommunicationDashboardDTO } from "./dto/notification-reports.dto";

// Communication Hub dashboard (Phase 15A Part 6): `queued` = NotificationQueue rows PENDING or
// PROCESSING ("awaiting or currently undergoing dispatch"); `pending` = strictly PENDING ("not yet
// even started," a subset of `queued`); `delivered`/`failed` = NotificationDelivery status counts
// across all time; `todaysNotifications` = Notification rows created today (UTC). Read-only.
export async function getCommunicationDashboard(tenantId: string): Promise<CommunicationDashboardDTO> {
  return queryCommunicationDashboardCounts(tenantId);
}
