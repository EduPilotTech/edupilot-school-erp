import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaTeacherAssignmentRepository } from "../infrastructure/prisma-teacher-assignment.repository";
import { PrismaPeriodConfigurationRepository } from "../infrastructure/prisma-period-configuration.repository";
import { PrismaWorkingDayRepository } from "../infrastructure/prisma-working-day.repository";
import { PrismaTimetableEntryRepository } from "../infrastructure/prisma-timetable-entry.repository";
import { checkTimetableConflicts } from "./conflict-detection.helpers";
import {
  ClassroomConflictError,
  InvalidPeriodError,
  NotAWorkingDayError,
  SectionConflictError,
  TeacherAssignmentNotFoundError,
  TeacherConflictError,
} from "../domain/errors";
import { createTimetableEntrySchema, type TimetableEntryDTO } from "./dto/timetable-entry.dto";

export interface CreateTimetableEntryContext {
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

// Always created FROM an existing, active TeacherAssignment (Phase 6 Decision 4 — "do not allow
// ad-hoc teacher allocation"). academicSessionId/classId/sectionId/subjectId/teacherId are
// denormalized from that assignment, never taken from the caller directly — see
// prisma/schema.prisma's TimetableEntry comment for why.
export async function createTimetableEntry(
  input: unknown,
  context: CreateTimetableEntryContext
): Promise<TimetableEntryDTO> {
  const parsed = createTimetableEntrySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid timetable entry data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const assignmentRepository = new PrismaTeacherAssignmentRepository();
  const assignment = await assignmentRepository.findById(tenantId, data.teacherAssignmentId);
  if (!assignment || !assignment.isActive) {
    throw new TeacherAssignmentNotFoundError();
  }

  const periodRepository = new PrismaPeriodConfigurationRepository();
  const period = await periodRepository.findById(tenantId, data.periodId);
  if (
    !period ||
    period.deletedAt !== null ||
    period.academicSessionId !== assignment.academicSessionId ||
    period.isBreak
  ) {
    throw new InvalidPeriodError();
  }

  const workingDayRepository = new PrismaWorkingDayRepository();
  const workingDays = await workingDayRepository.findByAcademicSession(tenantId, assignment.academicSessionId);
  const workingDay = workingDays.find((day) => day.dayOfWeek === data.dayOfWeek);
  if (!workingDay || !workingDay.isWorking) {
    throw new NotAWorkingDayError();
  }

  await checkTimetableConflicts(tenantId, {
    sectionId: assignment.sectionId,
    teacherId: assignment.teacherId,
    classroomId: data.classroomId ?? null,
    dayOfWeek: data.dayOfWeek,
    periodId: data.periodId,
  });

  const entryRepository = new PrismaTimetableEntryRepository();
  try {
    const entry = await entryRepository.create({
      tenantId,
      teacherAssignmentId: assignment.id,
      academicSessionId: assignment.academicSessionId,
      classId: assignment.classId,
      sectionId: assignment.sectionId,
      subjectId: assignment.subjectId,
      teacherId: assignment.teacherId,
      classroomId: data.classroomId ?? null,
      periodId: data.periodId,
      dayOfWeek: data.dayOfWeek,
      createdBy: actingUserId,
    });
    return toDTO(entry);
  } catch (error) {
    // Database-level backstop behind the service-layer pre-check above (architecture review
    // §K's "both levels" requirement) — a concurrent request could still win the race between
    // the check and this insert; the named unique constraint that fired (see
    // prisma/schema.prisma's `name:` on each) tells us exactly which conflict to report.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target);
      if (target.includes("unique_teacher_slot")) {
        throw new TeacherConflictError();
      }
      if (target.includes("unique_classroom_slot")) {
        throw new ClassroomConflictError();
      }
      throw new SectionConflictError();
    }
    throw error;
  }
}
