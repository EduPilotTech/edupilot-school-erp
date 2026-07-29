import "server-only";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { listVisibleNotices } from "@/modules/communication/application/list-notices.service";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";
import type { NoticeDTO } from "@/modules/communication/application/dto/notice.dto";

export interface GetMyNoticesContext {
  tenantId: string;
  userProfileId: string;
}

// Notice Board (requirement 14) — published, non-expired Notices visible to the student's own
// class + section, plus every ALL-audience Notice.
export async function getMyNotices(studentId: string, context: GetMyNoticesContext): Promise<NoticeDTO[]> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) return [];

  const enrollment = await getCurrentEnrollmentForStudent(studentId, currentSession.id, { tenantId: context.tenantId });
  if (!enrollment) return [];

  return listVisibleNotices(context.tenantId, currentSession.id, enrollment.classId, enrollment.sectionId);
}
