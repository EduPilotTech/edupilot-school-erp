import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listUsers } from "@/modules/users/application/list-users.service";
import { listNotificationTemplates } from "@/modules/communication/application/notification-template.service";
import { ComposeNotificationForm } from "@/components/features/notifications/ComposeNotificationForm";

// The admin "compose and send a notification" screen — distinct from each user's own personal
// in-app inbox (already built, untouched). Mirrors app/hr/employees/new/page.tsx's shape:
// gather every option list a Client Component form needs (recipients, active templates), then
// hand off. Real `notification.manage` enforcement lives on sendNotificationNowAction /
// scheduleNotificationAction; this page-level check is a UX gate only.
export default async function ComposeNotificationPage() {
  const authContext = await requireAuthContext();
  await requirePermission("notification.manage");

  const [activeUsers, templates] = await Promise.all([
    listUsers({ status: "ACTIVE", page: 1, pageSize: 100 }, { tenantId: authContext.tenantId }),
    listNotificationTemplates(authContext.tenantId, { isActive: true }),
  ]);

  const recipients = activeUsers.items
    .filter((user) => user.deletedAt === null)
    .map((user) => ({ id: user.id, fullName: user.fullName, email: user.email }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/communication" className="text-sm text-blue-600 hover:underline">
        ← Communication
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Send Notification</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Queue or send a notification to a user immediately, or schedule it for later.
      </p>

      <div className="mt-6">
        <ComposeNotificationForm recipients={recipients} templates={templates} />
      </div>
    </main>
  );
}
