import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { listNotificationTemplates } from "@/modules/communication/application/notification-template.service";
import { NotificationTemplateManager } from "@/components/features/notifications/NotificationTemplateManager";
import { NOTIFICATION_CHANNEL_OPTIONS } from "@/components/features/notifications/notification-type-labels";
import type { NotificationChannelValue } from "@/modules/communication/domain/notification-delivery.entity";

interface TemplatesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Notification Templates — list + create, mirroring app/hr/leave-types/page.tsx's exact shape.
// Filterable by channel via a GET `?channel=` param, matching every other report/list page's
// GET-form-filter convention in this codebase.
export default async function NotificationTemplatesPage({ searchParams }: TemplatesPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("template.manage");

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const channel = first(params.channel) as NotificationChannelValue | undefined;

  const templates = await listNotificationTemplates(authContext.tenantId, channel ? { channel } : undefined);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/communication" className="text-sm text-blue-600 hover:underline">
        ← Communication
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Notification Templates</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Reusable message templates for the notification queue, with placeholder variables.
      </p>

      <form method="get" className="mt-6 flex items-end gap-3">
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
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
        >
          Filter
        </button>
      </form>

      <div className="mt-6">
        <NotificationTemplateManager items={templates} canManage />
      </div>
    </main>
  );
}
