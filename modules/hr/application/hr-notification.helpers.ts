import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { dispatchNotification } from "@/modules/communication/application/dispatch-notification.helpers";

// Mirrors modules/library/application/library-notification.helpers.ts's `notifyLibraryMember`
// pattern, simplified: an Employee always has a UserProfile directly (1:1, no polymorphic member
// type to resolve), so this is a thin, direct wrapper around dispatchNotification. `type` is
// always PAYROLL_ALERT — the one NotificationType enum value approved for this phase, reused for
// every HR + Payroll notification since no separate HR_ALERT type was approved.
export async function notifyEmployee(
  tenantId: string,
  employeeUserProfileId: string,
  notification: { title: string; body: string; referenceType: string; referenceId: string },
  tx?: Prisma.TransactionClient
): Promise<void> {
  await dispatchNotification(
    {
      tenantId,
      recipientUserProfileId: employeeUserProfileId,
      type: "PAYROLL_ALERT",
      priority: "NORMAL",
      title: notification.title,
      body: notification.body,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
    },
    tx
  );
}
