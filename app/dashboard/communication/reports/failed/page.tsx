import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getFailedNotificationsReport } from "@/modules/communication/application/get-failed-notifications-report.service";
import { NOTIFICATION_CHANNEL_OPTIONS } from "@/components/features/notifications/notification-type-labels";
import type { NotificationChannelValue } from "@/modules/communication/domain/notification-delivery.entity";

interface FailedReportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Failed Notifications Report (Phase 15A spec §5) — GET-form filter (channel, date range) + table,
// mirroring app/hostel/reports/room-occupancy/page.tsx's Server Component shape.
export default async function FailedNotificationsReportPage({ searchParams }: FailedReportPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("notification.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const channel = first(params.channel) as NotificationChannelValue | undefined;
  const fromDateRaw = first(params.fromDate) || undefined;
  const toDateRaw = first(params.toDate) || undefined;

  const items = await getFailedNotificationsReport(authContext.tenantId, {
    channel,
    fromDate: fromDateRaw ? new Date(fromDateRaw) : undefined,
    toDate: toDateRaw ? new Date(toDateRaw) : undefined,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/dashboard/communication/reports" className="text-sm text-blue-600 hover:underline">
        ← Communication Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Failed Notifications Report</h1>
      <p className="mt-1 text-sm text-zinc-500">Delivery attempts that failed, filterable by channel and date range.</p>

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

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Notification Title</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Recipient ID</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Channel</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Error</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((item) => (
              <tr key={item.deliveryId}>
                <td className="px-4 py-2 font-medium text-zinc-900">{item.notificationTitle}</td>
                <td className="px-4 py-2 text-zinc-700">{item.recipientUserProfileId}</td>
                <td className="px-4 py-2 text-zinc-700">{item.channel}</td>
                <td className="px-4 py-2 text-red-700">{item.error ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-700">{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No failed deliveries found.</p>}
      </div>
    </main>
  );
}
