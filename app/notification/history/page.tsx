import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getNotificationReport } from "@/modules/communication/application/get-notification-report.service";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_OPTIONS,
  NOTIFICATION_CHANNEL_OPTIONS,
} from "@/components/features/notifications/notification-type-labels";
import type { NotificationTypeValue } from "@/modules/communication/domain/notification.entity";
import type { NotificationChannelValue } from "@/modules/communication/domain/notification-delivery.entity";

interface NotificationHistoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Notification History AND the "Notification Report" from the reports section are functionally
// identical — both are a filtered read of getNotificationReport(tenantId, filter) with no
// distinct aggregation. Consolidated into this single page rather than building two
// near-duplicate list-with-deliveries pages; the Reports hub (app/dashboard/communication/
// reports/page.tsx) links its "Notification Report" entry here instead of duplicating it.
export default async function NotificationHistoryPage({ searchParams }: NotificationHistoryPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("notification.view");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const type = first(params.type) as NotificationTypeValue | undefined;
  const channel = first(params.channel) as NotificationChannelValue | undefined;
  const fromDateRaw = first(params.fromDate) || undefined;
  const toDateRaw = first(params.toDate) || undefined;

  const items = await getNotificationReport(authContext.tenantId, {
    type,
    channel,
    fromDate: fromDateRaw ? new Date(fromDateRaw) : undefined,
    toDate: toDateRaw ? new Date(toDateRaw) : undefined,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/communication" className="text-sm text-blue-600 hover:underline">
        ← Communication
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Notification History</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every notification sent, filterable by type, channel, and date range, with delivery attempts.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-xs font-medium text-zinc-500">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={type ?? ""}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="">All types</option>
            {NOTIFICATION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

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
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Created</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Recipient</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Title</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-500">Deliveries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-zinc-700">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-zinc-700">{item.recipientUserProfileId}</td>
                <td className="px-4 py-2 text-zinc-700">{NOTIFICATION_TYPE_LABELS[item.type]}</td>
                <td className="px-4 py-2 font-medium text-zinc-900">{item.title}</td>
                <td className="px-4 py-2 text-zinc-700">
                  <details>
                    <summary className="cursor-pointer text-blue-600 hover:underline">
                      {item.deliveries.length} {item.deliveries.length === 1 ? "delivery" : "deliveries"}
                    </summary>
                    <table className="mt-2 min-w-full divide-y divide-zinc-200 text-xs">
                      <thead className="bg-zinc-50">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-zinc-500">Channel</th>
                          <th className="px-2 py-1 text-left font-medium text-zinc-500">Status</th>
                          <th className="px-2 py-1 text-left font-medium text-zinc-500">Provider</th>
                          <th className="px-2 py-1 text-left font-medium text-zinc-500">Sent At</th>
                          <th className="px-2 py-1 text-left font-medium text-zinc-500">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {item.deliveries.map((delivery, index) => (
                          <tr key={`${item.id}-${index}`}>
                            <td className="px-2 py-1 text-zinc-700">{delivery.channel}</td>
                            <td className="px-2 py-1 text-zinc-700">{delivery.status}</td>
                            <td className="px-2 py-1 text-zinc-700">{delivery.provider ?? "—"}</td>
                            <td className="px-2 py-1 text-zinc-700">
                              {delivery.sentAt ? new Date(delivery.sentAt).toLocaleString() : "—"}
                            </td>
                            <td className="px-2 py-1 text-zinc-700">{delivery.error ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-4 text-sm text-zinc-500">No notifications found.</p>}
      </div>
    </main>
  );
}
