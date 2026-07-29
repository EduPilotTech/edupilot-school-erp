import "server-only";
import { listActiveAcademicSessions } from "@/modules/academics/application/list-active-academic-sessions.service";
import { getCurrentEnrollmentForStudent } from "@/modules/students/application/list-current-enrollments.service";
import { listAssignmentsForClass } from "@/modules/timetable/application/list-assignments.service";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import { resolveGuardianForUserProfile, assertGuardianCanAccessStudent } from "./guardian-access.helpers";

export interface MyChildTeacherDTO {
  teacherId: string;
  fullName: string;
}

export interface ListMyTeachersForChildContext {
  tenantId: string;
  userProfileId: string;
}

// Backs the "New Message" composer — every teacher currently assigned to the child's own class +
// section, deduplicated by teacher.
export async function listMyTeachersForChild(
  studentId: string,
  context: ListMyTeachersForChildContext
): Promise<MyChildTeacherDTO[]> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  await assertGuardianCanAccessStudent(context.tenantId, guardian.id, studentId);

  const sessions = await listActiveAcademicSessions({ tenantId: context.tenantId });
  const currentSession = sessions.find((session) => session.isCurrent) ?? sessions[0];
  if (!currentSession) return [];

  const enrollment = await getCurrentEnrollmentForStudent(studentId, currentSession.id, { tenantId: context.tenantId });
  if (!enrollment) return [];

  const assignments = await listAssignmentsForClass(enrollment.classId, enrollment.sectionId, currentSession.id, {
    tenantId: context.tenantId,
  });
  const teacherIds = [...new Set(assignments.map((assignment) => assignment.teacherId))];

  const teacherRepository = new PrismaTeacherRepository();
  const userProfileRepository = new PrismaUserProfileRepository();

  const teachers: MyChildTeacherDTO[] = [];
  for (const teacherId of teacherIds) {
    const teacher = await teacherRepository.findById(context.tenantId, teacherId);
    if (!teacher || teacher.deletedAt !== null) continue;
    const userProfile = await userProfileRepository.findById(context.tenantId, teacher.userProfileId);
    if (!userProfile) continue;
    teachers.push({ teacherId, fullName: userProfile.fullName });
  }

  return teachers;
}
