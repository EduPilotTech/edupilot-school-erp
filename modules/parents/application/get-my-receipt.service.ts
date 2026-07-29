import "server-only";
import { getFeePayment } from "@/modules/fees/application/get-payment.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import { recordParentActivity } from "./record-parent-activity.helpers";
import type { FeePaymentDTO } from "@/modules/fees/application/dto/fee-payment.dto";

export interface GetMyReceiptContext {
  tenantId: string;
  userProfileId: string;
}

// Receipt Download (requirement 11) — reuses getFeePayment (Phase 8) and the same
// ReceiptView/ReceiptPrintView components (A4 + thermal), just on a parent-facing route
// (Decision 11). Access is gated on the PAYMENT's own studentId, not a studentId the caller
// supplies, so a parent can't view an arbitrary payment by guessing its id.
export async function getMyReceipt(paymentId: string, context: GetMyReceiptContext): Promise<FeePaymentDTO> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  const payment = await getFeePayment(context.tenantId, paymentId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, payment.studentId);

  await recordParentActivity({
    tenantId: context.tenantId,
    guardianId: guardian.id,
    userProfileId: context.userProfileId,
    action: "DOWNLOADED_RECEIPT",
    entityType: "FeePayment",
    entityId: paymentId,
  });

  return payment;
}
