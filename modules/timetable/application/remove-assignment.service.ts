import "server-only";
import { PrismaTeacherAssignmentRepository } from "../infrastructure/prisma-teacher-assignment.repository";
import { PrismaTimetableEntryRepository } from "../infrastructure/prisma-timetable-entry.repository";
import { TeacherAssignmentInUseError, TeacherAssignmentNotFoundError } from "../domain/errors";
import type { TeacherAssignmentDTO } from "./dto/teacher-assignment.dto";

export interface RemoveAssignmentContext {
  tenantId: string;
  actingUserId: string;
}

// "Unassign" is `isActive: false` on the existing row (upsert), never a delete — see
// TeacherAssignment's own schema comment. Phase 6.1: deactivation is now blocked while any
// active TimetableEntry still references this assignment (see TeacherAssignmentInUseError) —
// the caller must clear or reassign those timetable entries first, rather than silently
// orphaning a live scheduled slot.
export async function removeAssignment(
  assignmentId: string,
  context: RemoveAssignmentContext
): Promise<TeacherAssignmentDTO> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaTeacherAssignmentRepository();

  const existing = await repository.findById(tenantId, assignmentId);
  if (!existing) {
    throw new TeacherAssignmentNotFoundError();
  }

  const timetableEntryRepository = new PrismaTimetableEntryRepository();
  const isInUse = await timetableEntryRepository.existsActiveByAssignment(tenantId, assignmentId);
  if (isInUse) {
    throw new TeacherAssignmentInUseError();
  }

  const updated = await repository.upsertOne({
    tenantId,
    teacherId: existing.teacherId,
    subjectId: existing.subjectId,
    classId: existing.classId,
    sectionId: existing.sectionId,
    academicSessionId: existing.academicSessionId,
    isActive: false,
    updatedBy: actingUserId,
  });

  return {
    id: updated.id,
    teacherId: updated.teacherId,
    subjectId: updated.subjectId,
    academicSessionId: updated.academicSessionId,
    classId: updated.classId,
    sectionId: updated.sectionId,
    isActive: updated.isActive,
  };
}
