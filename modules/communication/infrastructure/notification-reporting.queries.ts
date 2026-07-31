import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { NotificationChannelValue, NotificationDeliveryStatusValue } from "../domain/notification-delivery.entity";
import type { NotificationPriorityValue, NotificationTypeValue } from "../domain/notification.entity";

// Read-only query surface for Phase 15A's reporting services (get-notification-report,
// get-delivery-report, get-failed-notifications-report, get-communication-dashboard).
// Deliberately separate from PrismaNotificationRepository / PrismaNotificationDeliveryRepository,
// which stay unchanged this phase — every producer since Phase 9 already depends on their exact
// existing (narrow, per-recipient / per-notification) method shapes, and growing those two
// interfaces with report-only, tenant-wide, multi-filter methods would be an unrelated change to
// files this phase's brief explicitly calls out as untouched. Reports instead talk to the same
// underlying `notification` / `notificationDelivery` tables directly through `withTenantContext`,
// exactly as tenant-scoped as every repository call, just without a repository interface wrapping
// this particular set of read queries.

export interface NotificationReportFilter {
  type?: NotificationTypeValue;
  channel?: NotificationChannelValue;
  fromDate?: Date;
  toDate?: Date;
}

export interface NotificationReportDeliveryRow {
  channel: NotificationChannelValue;
  status: NotificationDeliveryStatusValue;
  provider: string | null;
  sentAt: Date | null;
  error: string | null;
}

export interface NotificationReportRow {
  id: string;
  recipientUserProfileId: string;
  type: NotificationTypeValue;
  priority: NotificationPriorityValue;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  deliveries: NotificationReportDeliveryRow[];
}

export async function queryNotificationReport(
  tenantId: string,
  filter: NotificationReportFilter
): Promise<NotificationReportRow[]> {
  return withTenantContext(tenantId, async (tx) => {
    const rows = await tx.notification.findMany({
      where: {
        tenantId,
        type: filter.type,
        createdAt:
          filter.fromDate || filter.toDate
            ? { gte: filter.fromDate, lte: filter.toDate }
            : undefined,
        deliveries: filter.channel ? { some: { channel: filter.channel } } : undefined,
      },
      include: { deliveries: true },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => ({
      id: row.id,
      recipientUserProfileId: row.recipientUserProfileId,
      type: row.type as NotificationTypeValue,
      priority: row.priority as NotificationPriorityValue,
      title: row.title,
      body: row.body,
      readAt: row.readAt,
      createdAt: row.createdAt,
      deliveries: row.deliveries
        .filter((delivery) => !filter.channel || delivery.channel === filter.channel)
        .map((delivery) => ({
          channel: delivery.channel as NotificationChannelValue,
          status: delivery.status as NotificationDeliveryStatusValue,
          provider: delivery.provider,
          sentAt: delivery.sentAt,
          error: delivery.error,
        })),
    }));
  });
}

export interface DeliveryReportFilter {
  channel?: NotificationChannelValue;
  status?: NotificationDeliveryStatusValue;
  fromDate?: Date;
  toDate?: Date;
}

export interface DeliveryReportRow {
  id: string;
  notificationId: string;
  channel: NotificationChannelValue;
  status: NotificationDeliveryStatusValue;
  provider: string | null;
  providerMessageId: string | null;
  sentAt: Date | null;
  error: string | null;
  createdAt: Date;
}

export interface DeliveryReportResult {
  items: DeliveryReportRow[];
  countsByStatus: Record<NotificationDeliveryStatusValue, number>;
}

// `countsByStatus` deliberately aggregates over `channel`/date filters only (NOT the `status`
// filter) — it answers "what's the distribution of outcomes for this slice," which is only
// meaningful if `status` itself hasn't already narrowed the slice to one bucket. `items` applies
// every filter, including `status`.
export async function queryDeliveryReport(tenantId: string, filter: DeliveryReportFilter): Promise<DeliveryReportResult> {
  return withTenantContext(tenantId, async (tx) => {
    const baseWhere = {
      tenantId,
      channel: filter.channel,
      createdAt:
        filter.fromDate || filter.toDate ? { gte: filter.fromDate, lte: filter.toDate } : undefined,
    };

    const [rows, statusGroups] = await Promise.all([
      tx.notificationDelivery.findMany({
        where: { ...baseWhere, status: filter.status },
        orderBy: { createdAt: "desc" },
      }),
      tx.notificationDelivery.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    const countsByStatus: Record<NotificationDeliveryStatusValue, number> = {
      PENDING: 0,
      SENT: 0,
      FAILED: 0,
      DELIVERED: 0,
    };
    for (const group of statusGroups) {
      countsByStatus[group.status as NotificationDeliveryStatusValue] = group._count._all;
    }

    return {
      items: rows.map((row) => ({
        id: row.id,
        notificationId: row.notificationId,
        channel: row.channel as NotificationChannelValue,
        status: row.status as NotificationDeliveryStatusValue,
        provider: row.provider,
        providerMessageId: row.providerMessageId,
        sentAt: row.sentAt,
        error: row.error,
        createdAt: row.createdAt,
      })),
      countsByStatus,
    };
  });
}

export interface FailedNotificationsReportFilter {
  channel?: NotificationChannelValue;
  fromDate?: Date;
  toDate?: Date;
}

export interface FailedNotificationReportRow {
  deliveryId: string;
  notificationId: string;
  channel: NotificationChannelValue;
  error: string | null;
  createdAt: Date;
  notificationTitle: string;
  recipientUserProfileId: string;
}

export async function queryFailedNotificationsReport(
  tenantId: string,
  filter: FailedNotificationsReportFilter
): Promise<FailedNotificationReportRow[]> {
  return withTenantContext(tenantId, async (tx) => {
    const rows = await tx.notificationDelivery.findMany({
      where: {
        tenantId,
        status: "FAILED",
        channel: filter.channel,
        createdAt:
          filter.fromDate || filter.toDate ? { gte: filter.fromDate, lte: filter.toDate } : undefined,
      },
      include: { notification: true },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => ({
      deliveryId: row.id,
      notificationId: row.notificationId,
      channel: row.channel as NotificationChannelValue,
      error: row.error,
      createdAt: row.createdAt,
      notificationTitle: row.notification.title,
      recipientUserProfileId: row.notification.recipientUserProfileId,
    }));
  });
}

export interface CommunicationDashboardCounts {
  todaysNotifications: number;
  // PENDING + PROCESSING — "awaiting or currently undergoing dispatch."
  queued: number;
  // Strictly PENDING — "not yet even started." A subset of `queued`.
  pending: number;
  // NotificationDelivery rows with status SENT or DELIVERED, across all time.
  delivered: number;
  // NotificationDelivery rows with status FAILED, across all time.
  failed: number;
}

export async function queryCommunicationDashboardCounts(tenantId: string): Promise<CommunicationDashboardCounts> {
  return withTenantContext(tenantId, async (tx) => {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [todaysNotifications, queued, pending, deliveryGroups] = await Promise.all([
      tx.notification.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
      tx.notificationQueue.count({ where: { tenantId, status: { in: ["PENDING", "PROCESSING"] } } }),
      tx.notificationQueue.count({ where: { tenantId, status: "PENDING" } }),
      tx.notificationDelivery.groupBy({ by: ["status"], where: { tenantId }, _count: { _all: true } }),
    ]);

    let delivered = 0;
    let failed = 0;
    for (const group of deliveryGroups) {
      if (group.status === "SENT" || group.status === "DELIVERED") delivered += group._count._all;
      if (group.status === "FAILED") failed += group._count._all;
    }

    return { todaysNotifications, queued, pending, delivered, failed };
  });
}
