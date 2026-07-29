import "server-only";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { PrismaTeacherAssignmentRepository } from "@/modules/timetable/infrastructure/prisma-teacher-assignment.repository";
import { MarksEntryNotAuthorizedError } from "../domain/errors";
import type { ExamSubjectEntity } from "../domain/exam-subject.entity";

// Phase 7 Decision 4: a Teacher may only enter marks for an ExamSubject whose Class they hold a
// matching, active TeacherAssignment for; Admin/Principal manage all. RBAC's `marks.entry`
// permission (granted to both tiers) only answers "can this role enter marks at all" — it can't
// express "only for their own assignment," so that narrower rule lives here, at the service
// layer. If the acting user has no Teacher record at all, they're assumed to be one of the
// broader roles RBAC already gated `marks.entry` to (Admin/Principal) — every UserProfile that
// CAN hold a TeacherAssignment already has a Teacher record by Phase 6 Decision 1's own design,
// so "no Teacher record" and "not a classroom teacher" are the same fact here.
export async function assertMarksEntryAuthorized(
  tenantId: string,
  actingUserId: string,
  examSubject: ExamSubjectEntity,
  academicSessionId: string
): Promise<void> {
  const teacherRepository = new PrismaTeacherRepository();
  const teacher = await teacherRepository.findByUserProfileId(tenantId, actingUserId);
  if (!teacher) {
    return;
  }

  const assignmentRepository = new PrismaTeacherAssignmentRepository();
  const assignments = await assignmentRepository.findByTeacher(tenantId, teacher.id, academicSessionId);
  const isAssigned = assignments.some(
    (assignment) => assignment.subjectId === examSubject.subjectId && assignment.classId === examSubject.classId
  );
  if (!isAssigned) {
    throw new MarksEntryNotAuthorizedError();
  }
}
