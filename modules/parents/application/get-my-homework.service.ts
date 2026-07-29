import "server-only";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { listHomeworkForClass } from "@/modules/communication/application/list-homework.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { HomeworkDTO } from "@/modules/communication/application/dto/homework.dto";

export interface GetMyHomeworkContext {
  tenantId: string;
  userProfileId: string;
}

// Homework (requirement 12, view-only per Decision 3) — scoped to the student's own class +
// section for the current AcademicSession.
export async function getMyHomework(studentId: string, context: GetMyHomeworkContext): Promise<HomeworkDTO[]> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) return [];

  const enrollment = await getCurrentEnrollmentForStudent(studentId, currentSession.id, { tenantId: context.tenantId });
  if (!enrollment) return [];

  return listHomeworkForClass(context.tenantId, enrollment.classId, enrollment.sectionId);
}
