"use server";

// Thin Server Actions only — Discount/Scholarship/Concession/Waiver (Phase 8 requirements 8, 21, 22).

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { applyConcession } from "@/modules/fees/application/apply-concession.service";
import { removeConcession } from "@/modules/fees/application/remove-concession.service";
import { translateFeeError, type ActionResult } from "../_lib/translate-fee-error";
import type { FeeConcessionDTO } from "@/modules/fees/application/dto/fee-concession.dto";

export async function applyConcessionAction(input: unknown): Promise<ActionResult<FeeConcessionDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.concession.manage");
  try {
    const concession = await applyConcession(input, {
      tenantId: authContext.tenantId,
      actingUserId: authContext.userId,
    });
    return { success: true, data: concession };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function removeConcessionAction(concessionId: string): Promise<ActionResult<null>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.concession.manage");
  try {
    await removeConcession(concessionId, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: null };
  } catch (error) {
    return translateFeeError(error);
  }
}
