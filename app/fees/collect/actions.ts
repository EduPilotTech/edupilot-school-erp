"use server";

// Thin Server Actions only — Cash Collection, Partial Payments, and Reversal (Phase 8
// requirements 13, 14, 23). `fee.payment.collect` and `fee.payment.reverse` are deliberately
// separate permission codes (Cashier holds only the former) — see prisma/seed.ts's Phase 8
// comment.

import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { collectPayment } from "@/modules/fees/application/collect-payment.service";
import { reversePayment } from "@/modules/fees/application/reverse-payment.service";
import { translateFeeError, type ActionResult } from "../_lib/translate-fee-error";
import type { FeePaymentDTO } from "@/modules/fees/application/dto/fee-payment.dto";

export async function collectPaymentAction(input: unknown): Promise<ActionResult<FeePaymentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.payment.collect");
  try {
    const payment = await collectPayment(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: payment };
  } catch (error) {
    return translateFeeError(error);
  }
}

export async function reversePaymentAction(input: unknown): Promise<ActionResult<FeePaymentDTO>> {
  const authContext = await requireAuthContext();
  await requirePermission("fee.payment.reverse");
  try {
    const payment = await reversePayment(input, { tenantId: authContext.tenantId, actingUserId: authContext.userId });
    return { success: true, data: payment };
  } catch (error) {
    return translateFeeError(error);
  }
}
