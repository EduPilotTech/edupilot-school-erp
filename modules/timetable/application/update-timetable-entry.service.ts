import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaTeacherAssignmentRepository } from "../infrastructure/prisma-teacher-assignment.repository";
import { PrismaTimetableEntryRepository } from "../infrastructure/prisma-timetable-entry.repository";
import { checkTimetableConflicts } from "./conflict-detection.helpers";
import {
  ClassroomConflictError,
  TeacherAssignmentNotFoundError,
  TeacherConflictError,
  TimetableEntryNotFoundError,
} from "../domain/errors";
import { updateTimetableEntrySchema, type TimetableEntryDTO } from "./dto/timetable-entry.dto";

export interface UpdateTimetableEntryContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: {
  id: string;
  teacherAssignmentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string | null;
  periodId: string;
  dayOfWeek: string;
}): TimetableEntryDTO {
  return {
    id: entity.id,
    teacherAssignmentId: entity.teacherAssignmentId,
    academicSessionId: entity.academicSessionId,
    classId: entity.classId,
    sectionId: entity.sectionId,
    subjectId: entity.subjectId,
    teacherId: entity.teacherId,
    classroomId: entity.classroomId,
    periodId: entity.periodId,
    dayOfWeek: entity.dayOfWeek,
  };
}

// Reassigns an existing slot to a different teacher/subject/classroom — the slot's own
// day/period/section never change here (that's a delete-and-recreate, not an update, see
// TimetableEntryRepository's own comment). The replacement assignment must still be an active
// assignment for the SAME section/session this slot already belongs to.
export async function updateTimetableEntry(
  entryId: string,
  input: unknown,
  context: UpdateTimetableEntryContext
): Promise<TimetableEntryDTO> {
  const parsed = updateTimetableEntrySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid timetable entry data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const entryRepository = new PrismaTimetableEntryRepository();
  const existing = await entryRepository.findById(tenantId, entryId);
  if (!existing) {
    throw new TimetableEntryNotFoundError();
  }

  const assignmentRepository = new PrismaTeacherAssignmentRepository();
  const assignment = await assignmentRepository.findById(tenantId, data.teacherAssignmentId);
  if (
    !assignment ||
    !assignment.isActive ||
    assignment.sectionId !== existing.sectionId ||
    assignment.academicSessionId !== existing.academicSessionId
  ) {
    throw new TeacherAssignmentNotFoundError();
  }

  await checkTimetableConflicts(
    tenantId,
    {
      sectionId: existing.sectionId,
      teacherId: assignment.teacherId,
      classroomId: data.classroomId ?? null,
      dayOfWeek: existing.dayOfWeek,
      periodId: existing.periodId,
    },
    entryId
  );

  try {
    const updated = await entryRepository.update(tenantId, entryId, {
      teacherAssignmentId: assignment.id,
      subjectId: assignment.subjectId,
      teacherId: assignment.teacherId,
      classroomId: data.classroomId ?? null,
      updatedBy: actingUserId,
    });
    return toDTO(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target);
      if (target.includes("unique_classroom_slot")) {
        throw new ClassroomConflictError();
      }
      throw new TeacherConflictError();
    }
    throw error;
  }
}
