import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getDeliveryReport } from "@/modules/communication/application/get-delivery-report.service";
import {
  NOTIFICATION_CHANNEL_OPTIONS,
  NOTIFICATION_DELIVERY_STATUS_OPTIONS,
  NOTIFICATION_DELIVERY_STATUS_LABELS,
} from "@/components/features/notifications/notification-type-labels";
import type { NotificationChannelValue, NotificationDeliveryStatusValue } from "@/modules/communication/domain/notification-delivery.entity";

interface DeliveryReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Delivery Report (Phase 15A spec §5) — GET-form filter (channel, status, date range) + a
// "counts by status" summary row above the item table, mirroring
// app/hostel/reports/room-occupancy/page.tsx's Server Component shape.
export default async function DeliveryReportPage({ searchParams }: DeliveryReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("notification.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const channel = first(params.channel) as NotificationChannelValue | undefined;
  const status = first(params.status) as NotificationDeliveryStatusValue | undefined;
  const fromDateRaw = first(params.fromDate) || undefined;
  const toDateRaw = first(params.toDate) || undefined;

  const report = await getDeliveryReport(authContext.tenantId, {
    channel,
    status,
    fromDate: fromDateRaw ? new Date(fromDateRaw) : undefined,
    toDate: toDateRaw ? new Date(toDateRaw) : undefined,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/dashboard/communication/reports" className="text-sm text-blue-600 hover:underline">
        ← Communication Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Delivery Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Every delivery attempt, filterable by channel, status, and date range.</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="channel" className="text-xs font-medium text-zinc-500">
            Channel
          </label>
          <select
            id="channel"
            name="channel"
            defaultValue={channel ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All channels</option>
            {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-zinc-500">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {NOTIFICATION_DELIVERY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fromDate" className="text-xs font-medium text-zinc-500">
            From Date
          </label>
          <input
            id="fromDate"
            name="fromDate"
            type="date"
            defaultValue={fromDateRaw ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="toDate" className="text-xs font-medium text-zinc-500">
            To Date
          </label>
          <input
            id="toDate"
            name="toDate"
            type="date"
            defaultValue={toDateRaw ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Filter
        </button>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {NOTIFICATION_DELIVERY_STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">{NOTIFICATION_DELIVERY_STATUS_LABELS[option.value]}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{report.countsByStatus[option.value] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">ID</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Notification ID</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Channel</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Provider</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Sent At</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {report.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-zinc-700">{item.id}</td>
                <td className="px-4 py-2 text-zinc-700">{item.notificationId}</td>
                <td className="px-4 py-2 text-zinc-700">{item.channel}</td>
                <td className="px-4 py-2 text-zinc-700">{item.status}</td>
                <td className="px-4 py-2 text-zinc-700">{item.provider ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{item.sentAt ? new Date(item.sentAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{item.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {report.items.length === 0 && <p className="p-4 text-sm text-zinc-500">No delivery attempts found.</p>}
      </div>
    </main>
  );
}
