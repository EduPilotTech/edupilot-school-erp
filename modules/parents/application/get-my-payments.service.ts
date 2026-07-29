import "server-only";
import { listStudentPayments } from "@/modules/fees/application/get-payment.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { FeePaymentDTO } from "@/modules/fees/application/dto/fee-payment.dto";

export interface GetMyPaymentsContext {
  tenantId: string;
  userProfileId: string;
}

// Payment History (requirement 10) — reuses listStudentPayments (Phase 8) directly, scoped to
// the tenant's current AcademicSession.
export async function getMyPayments(studentId: string, context: GetMyPaymentsContext): Promise<FeePaymentDTO[]> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) return [];

  return listStudentPayments(context.tenantId, studentId, currentSession.id);
}
