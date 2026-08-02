import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import { dispatchNotification } from "@/modules/communication/application/dispatch-notification.helpers";
import type { Prisma } from "@/lib/generated/prisma/client";

// Phase 16, Bundle D Part Two, Step 1.
//
// Every subscription-automation notification in this bundle (Renewal/Grace/Expiry reminders) is
// addressed to a SCHOOL, not to one known individual the way notifyEmployee's own employeeUserProfileId
// is already known — so, unlike modules/hr/application/hr-notification.helpers.ts's thin
// single-recipient wrapper around dispatchNotification, this helper must first resolve WHO at the
// tenant should receive it: every UserProfile holding the tenant's "SCHOOL_ADMIN" role (role code
// confirmed against prisma/seed.ts's SYSTEM_ROLES array), then dispatch to each of them.
export interface NotifyTenantAdminsInput {
  title: string;
  body: string;
  referenceType: string;
  referenceId: string;
}

// Resolves every SCHOOL_ADMIN UserProfile for `tenantId` and dispatches a SUBSCRIPTION_ALERT
// notification to each, deduplicated by user id (a user could in principle hold the role via more
// than one UserRole row — the (userId, roleId) unique constraint does not prevent that if a
// tenant's RBAC data ever assigns SCHOOL_ADMIN through two different Role rows). Mirrors
// PrismaUserRoleRepository's own withTenantContext idiom for reading UserRole scoped by tenantId.
//
// If no SCHOOL_ADMIN is currently resolvable for the tenant (a real, possible edge case — e.g. a
// tenant whose only admin account was deactivated), this is a silent no-op, not an error: there is
// genuinely no one to notify, and this must never block whatever lifecycle transition or reminder
// sweep triggered the call.
export async function notifyTenantAdmins(
  tenantId: string,
  notification: NotifyTenantAdminsInput,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const assignments = await withTenantContext(
    tenantId,
    (client) =>
      client.userRole.findMany({
        where: { tenantId, role: { code: "SCHOOL_ADMIN" } },
        include: { user: true },
      }),
    tx
  );

  const notifiedUserIds = new Set<string>();

  for (const assignment of assignments) {
    if (notifiedUserIds.has(assignment.userId)) {
      continue;
    }
    notifiedUserIds.add(assignment.userId);

    await dispatchNotification(
      {
        tenantId,
        recipientUserProfileId: assignment.userId,
        type: "SUBSCRIPTION_ALERT",
        priority: "HIGH",
        title: notification.title,
        body: notification.body,
        referenceType: notification.referenceType,
        referenceId: notification.referenceId,
      },
      tx
    );
  }
}
