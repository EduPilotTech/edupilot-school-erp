"use server";

// Thin Server Actions only — staff-side Parent Account creation (requirement 1/2): linking an
// existing Guardian contact record to a new parent-portal UserProfile.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { linkGuardianAccount } from "@/modules/parents/application/link-guardian-account.service";
import { translateParentError, type ActionResult } from "@/app/parent/_lib/translate-parent-error";
import type { GuardianEntity } from "@/modules/students/domain/guardian.entity";

export async function linkGuardianAccountAction(input: unknown): Promise<ActionResult<GuardianEntity>> {
  const authContext = await requireAuthContext();
  await requirePermission("parent.account.link");

  try {
    const guardian = await linkGuardianAccount(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: guardian };
  } catch (error) {
    return translateParentError(error);
  }
}
