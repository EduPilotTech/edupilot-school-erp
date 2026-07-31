import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { getCommunicationDashboard } from "@/modules/communication/application/get-communication-dashboard.service";

// Communication Hub dashboard (Phase 15A spec §1) — a grid of stat cards, mirroring
// app/hr/dashboard/page.tsx's exact shape. This codebase has no charting library — plain numbers
// only.
export default async function CommunicationDashboardPage() {
  const authContext = await requireAuthContext();
  await requirePermission("notification.view");

  const dashboard = await getCommunicationDashboard(authContext.tenantId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/communication" className="text-sm text-blue-600 hover:underline">
        ← Communication
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Communication Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Today&apos;s notification volume and queue/delivery status at a glance.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Today&apos;s Notifications</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{dashboard.todaysNotifications}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Queued</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{dashboard.queued}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Delivered</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{dashboard.delivered}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Failed</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">{dashboard.failed}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm font-medium text-zinc-500">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{dashboard.pending}</p>
        </div>
      </div>
    </main>
  );
}
