import "server-only";
import { PrismaTimetableEntryRepository } from "../infrastructure/prisma-timetable-entry.repository";
import { ClassroomConflictError, SectionConflictError, TeacherConflictError } from "../domain/errors";
import type { DayOfWeekValue } from "../domain/working-day.entity";

// Service-layer pre-check for all three conflict dimensions (architecture review §K) —
// friendly, specific error messages ahead of the database's own three unique constraints, which
// remain the ultimate guarantee (see create-timetable-entry.service.ts's P2002 fallback).
// `excludingEntryId` lets update-timetable-entry.service.ts re-check without tripping over the
// entry's own existing row.
export async function checkTimetableConflicts(
  tenantId: string,
  params: {
    sectionId: string;
    teacherId: string;
    classroomId: string | null;
    dayOfWeek: DayOfWeekValue;
    periodId: string;
  },
  excludingEntryId?: string
): Promise<void> {
  const repository = new PrismaTimetableEntryRepository();

  const sectionConflict = await repository.findBySectionSlot(
    tenantId,
    params.sectionId,
    params.dayOfWeek,
    params.periodId
  );
  if (sectionConflict && sectionConflict.id !== excludingEntryId) {
    throw new SectionConflictError();
  }

  const teacherConflict = await repository.findByTeacherSlot(
    tenantId,
    params.teacherId,
    params.dayOfWeek,
    params.periodId
  );
  if (teacherConflict && teacherConflict.id !== excludingEntryId) {
    throw new TeacherConflictError();
  }

  if (params.classroomId) {
    const classroomConflict = await repository.findByClassroomSlot(
      tenantId,
      params.classroomId,
      params.dayOfWeek,
      params.periodId
    );
    if (classroomConflict && classroomConflict.id !== excludingEntryId) {
      throw new ClassroomConflictError();
    }
  }
}
