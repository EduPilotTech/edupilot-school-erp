import "server-only";
import { getStudentFeeLedger } from "@/modules/fees/application/get-student-fee-ledger.service";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { FeeLedgerEntryDTO } from "@/modules/fees/application/dto/fee-ledger.dto";

export interface GetMyFeeLedgerContext {
  tenantId: string;
  userProfileId: string;
}

export async function getMyFeeLedger(studentId: string, context: GetMyFeeLedgerContext): Promise<FeeLedgerEntryDTO[]> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) return [];

  return getStudentFeeLedger(context.tenantId, studentId, currentSession.id);
}
