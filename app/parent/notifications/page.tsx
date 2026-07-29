import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listMyNotifications } from "@/modules/communication/application/list-notifications.service";
import { NotificationList } from "@/components/features/parents/NotificationList";

export default async function ParentNotificationsPage() {
  const authContext = await requireAuthContext();
  await requirePermission("parent.notification.view");

  const notifications = await listMyNotifications(authContext.tenantId, authContext.userId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Notifications</h1>
      <div className="mt-6">
        <NotificationList notifications={notifications} />
      </div>
    </main>
  );
}
