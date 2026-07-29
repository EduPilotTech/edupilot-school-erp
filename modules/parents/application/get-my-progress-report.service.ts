import "server-only";
import { getStudentProgressReport } from "@/modules/examinations/application/get-student-progress-report.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { StudentProgressReportDTO } from "@/modules/examinations/application/dto/progress-report.dto";

export interface GetMyProgressReportContext {
  tenantId: string;
  userProfileId: string;
}

// Examination Results (requirement 7) — reuses get-student-progress-report.service.ts (Phase 7),
// which already only ever surfaces published ExamResult rows.
export async function getMyProgressReport(
  studentId: string,
  context: GetMyProgressReportContext
): Promise<StudentProgressReportDTO> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  return getStudentProgressReport(studentId, { tenantId: context.tenantId });
}
