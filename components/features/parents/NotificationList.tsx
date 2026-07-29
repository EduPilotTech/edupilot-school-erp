"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markNotificationReadAction } from "@/app/parent/actions";
import type { NotificationEntity } from "@/modules/communication/domain/notification.entity";

interface NotificationListProps {
  notifications: NotificationEntity[];
}

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "border-red-300 bg-red-50",
  HIGH: "border-amber-300 bg-amber-50",
  NORMAL: "border-zinc-200 bg-white",
  LOW: "border-zinc-200 bg-white",
};

// Push Notification Read Status (requirement 19) + priority levels (requirement 10, Decision 10).
export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [markingId, setMarkingId] = useState<string | null>(null);

  async function handleMarkRead(notificationId: string) {
    setMarkingId(notificationId);
    try {
      const result = await markNotificationReadAction(notificationId);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setMarkingId(null);
    }
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-zinc-500">No notifications yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-xl border p-4 ${PRIORITY_STYLES[notification.priority] ?? PRIORITY_STYLES.NORMAL}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900">{notification.title}</h2>
                {!notification.readAt && <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Unread" />}
              </div>
              <p className="mt-1 text-sm text-zinc-700">{notification.body}</p>
              <p className="mt-1 text-xs text-zinc-500">{new Date(notification.createdAt).toLocaleString()}</p>
            </div>
            {!notification.readAt && (
              <button
                type="button"
                onClick={() => handleMarkRead(notification.id)}
                disabled={markingId === notification.id}
                className="shrink-0 text-sm text-blue-600 hover:underline disabled:opacity-50"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
