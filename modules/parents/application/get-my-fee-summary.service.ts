import "server-only";
import { listOutstandingInvoicesForStudent } from "@/modules/fees/application/list-invoices.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { FeeInvoiceDTO } from "@/modules/fees/application/dto/fee-invoice.dto";

export interface GetMyFeeSummaryContext {
  tenantId: string;
  userProfileId: string;
}

// Fee Due Summary (requirement 9) — reuses listOutstandingInvoicesForStudent (Phase 8) directly,
// which already applies the live fine computation (Decision 4).
export async function getMyFeeSummary(studentId: string, context: GetMyFeeSummaryContext): Promise<FeeInvoiceDTO[]> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  return listOutstandingInvoicesForStudent(context.tenantId, studentId);
}
