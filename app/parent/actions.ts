"use server";

// Thin Server Actions only — no business logic here, matching every other actions.ts in this
// codebase. Covers the two parent-facing WRITE actions this phase has (everything else is a pure
// read, called directly from Server Component pages per this codebase's established
// convention) — Parent <-> Teacher Messaging (requirement 17) and Push Notification Read Status
// (requirement 19).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { sendMessageAsParent } from "@/modules/parents/application/send-message.service";
import {
  listMyTeachersForChild,
  type MyChildTeacherDTO,
} from "@/modules/parents/application/list-my-teachers-for-child.service";
import { markNotificationRead } from "@/modules/communication/application/mark-notification-read.service";
import { translateParentError, type ActionResult } from "./_lib/translate-parent-error";
import type { MessageDTO } from "@/modules/communication/application/dto/message.dto";
import type { NotificationEntity } from "@/modules/communication/domain/notification.entity";

export async function sendMessageAction(input: unknown): Promise<ActionResult<MessageDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("parent.message.send");

  try {
    const message = await sendMessageAsParent(input, {
      tenantId: authContext.tenantId,
      userProfileId: authContext.userId,
    });
    return { success: true, data: message };
  } catch (error) {
    return translateParentError(error);
  }
}

export async function listMyTeachersForChildAction(studentId: string): Promise<ActionResult<MyChildTeacherDTO[]>> {
  const authContext = await requireAuthContext();
  await requirePermission("parent.message.send");

  try {
    const teachers = await listMyTeachersForChild(studentId, {
      tenantId: authContext.tenantId,
      userProfileId: authContext.userId,
    });
    return { success: true, data: teachers };
  } catch (error) {
    return translateParentError(error);
  }
}

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult<NotificationEntity>> {
  const authContext = await requireAuthContext();
  await requirePermission("parent.notification.view");

  try {
    const notification = await markNotificationRead(authContext.tenantId, notificationId, authContext.userId);
    return { success: true, data: notification };
  } catch (error) {
    return translateParentError(error);
  }
}
