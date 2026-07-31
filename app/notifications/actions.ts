"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase (app/hr/actions.ts, app/payroll/actions.ts, app/finance/actions.ts). Covers Phase 15A's
// Communication Hub: NotificationTemplate CRUD and the Notification Queue engine (queue/send/
// schedule/retry/cancel). Reports and the Dashboard are pure reads with no Server Actions, per this
// codebase's established convention — called directly from Server Component pages.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import {
  createNotificationTemplate,
  updateNotificationTemplate,
  softDeleteNotificationTemplate,
} from "@/modules/communication/application/notification-template.service";
import {
  queueNotification,
  sendNotificationNow,
  scheduleNotification,
  retryNotification,
  cancelNotification,
  type QueuedNotificationResult,
} from "@/modules/communication/application/notification-queue.service";
import { translateNotificationError, type ActionResult } from "./_lib/translate-notification-error";
import type { NotificationTemplateDTO } from "@/modules/communication/application/dto/notification-template.dto";

// --- Notification Template ---------------------------------------------------------------------

export async function createNotificationTemplateAction(input: unknown): Promise<ActionResult<NotificationTemplateDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("template.manage");
  try {
    const template = await createNotificationTemplate(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: template };
  } catch (error) {
    return translateNotificationError(error);
  }
}

export async function updateNotificationTemplateAction(
  id: string,
  input: unknown
): Promise<ActionResult<NotificationTemplateDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("template.manage");
  try {
    const template = await updateNotificationTemplate(id, input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: template };
  } catch (error) {
    return translateNotificationError(error);
  }
}

export async function deleteNotificationTemplateAction(id: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("template.manage");
  try {
    await softDeleteNotificationTemplate(id, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateNotificationError(error);
  }
}

// --- Notification Queue (send / queue / schedule / retry / cancel) ------------------------------

export async function queueNotificationAction(input: unknown): Promise<ActionResult<QueuedNotificationResult>> {
  const authContext = await requireAuthContext();
  await requirePermission("notification.manage");
  try {
    const result = await queueNotification(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: result };
  } catch (error) {
    return translateNotificationError(error);
  }
}

export async function sendNotificationNowAction(input: unknown): Promise<ActionResult<QueuedNotificationResult>> {
  const authContext = await requireAuthContext();
  await requirePermission("notification.manage");
  try {
    const result = await sendNotificationNow(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: result };
  } catch (error) {
    return translateNotificationError(error);
  }
}

export async function scheduleNotificationAction(input: unknown): Promise<ActionResult<QueuedNotificationResult>> {
  const authContext = await requireAuthContext();
  await requirePermission("notification.manage");
  try {
    const result = await scheduleNotification(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: result };
  } catch (error) {
    return translateNotificationError(error);
  }
}

export async function retryNotificationAction(notificationId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("notification.manage");
  try {
    await retryNotification(notificationId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateNotificationError(error);
  }
}

export async function cancelNotificationAction(notificationId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("notification.manage");
  try {
    await cancelNotification(notificationId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateNotificationError(error);
  }
}
