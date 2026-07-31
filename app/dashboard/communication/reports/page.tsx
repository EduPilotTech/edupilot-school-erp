import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";

interface CommunicationReportHubLink {
  href: string;
  label: string;
  description: string;
}

// Mirrors app/finance/reports/page.tsx's hub pattern — every Communication report is gated by the
// same `notification.view` permission (checked once here). "Notification Report" links to
// /notification/history rather than a separate page — see that page's own comment for why the
// two are functionally identical (both call getNotificationReport) and were consolidated.
const LINKS: CommunicationReportHubLink[] = [
  {
    href: "/notification/history",
    label: "Notification Report",
    description: "Every notification sent, filterable by type, channel, and date range, with deliveries",
  },
  {
    href: "/dashboard/communication/reports/delivery",
    label: "Delivery Report",
    description: "Every delivery attempt, filterable by channel and status, with counts by status",
  },
  {
    href: "/dashboard/communication/reports/failed",
    label: "Failed Notifications Report",
    description: "Delivery attempts that failed, with the parent notification's title and recipient",
  },
];

export default async function CommunicationReportsHubPage() {
  await requireAuthContext();
  await requirePermission("notification.view");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/dashboard/communication" className="text-sm text-blue-600 hover:underline">
        ← Communication Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Communication Reports</h1>
      <p className="mt-1 text-sm text-zinc-500">Notification, delivery, and failed-notification reports.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400"
          >
            <h2 className="text-base font-semibold text-zinc-900">{link.label}</h2>
            <p className="mt-1 text-sm text-zinc-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
