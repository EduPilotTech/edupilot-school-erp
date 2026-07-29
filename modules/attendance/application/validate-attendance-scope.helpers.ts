import "server-only";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaSectionRepository } from "@/modules/academics/infrastructure/prisma-section.repository";
import {
  InvalidAcademicSessionError,
  InvalidClassError,
  InvalidSectionError,
} from "@/modules/students/domain/errors";
import { InvalidAttendanceDateError, AttendanceDateOutsideSessionError } from "../domain/errors";
import type { AcademicSessionEntity } from "@/modules/academics/domain/academic-session.entity";
import type { ClassEntity } from "@/modules/academics/domain/class.entity";
import type { SectionEntity } from "@/modules/academics/domain/section.entity";

export interface AttendanceScope {
  session: AcademicSessionEntity;
  classEntity: ClassEntity;
  section: SectionEntity;
}

// Shared by mark-student-attendance and bulk-mark-student-attendance — both need the exact same
// "session/class/section exist, belong to each other, and the date is valid within the session"
// validation. Reuses modules/students' existing InvalidAcademicSessionError/InvalidClassError/
// InvalidSectionError (see modules/attendance/domain/errors.ts's own comment on why) rather than
// duplicating equivalent classes.
export async function validateAttendanceScope(
  tenantId: string,
  academicSessionId: string,
  classId: string,
  sectionId: string,
  date: Date
): Promise<AttendanceScope> {
  if (date.getTime() > Date.now()) {
    throw new InvalidAttendanceDateError();
  }

  const sessionRepository = new PrismaAcademicSessionRepository();
  const classRepository = new PrismaClassRepository();
  const sectionRepository = new PrismaSectionRepository();

  const session = await sessionRepository.findById(tenantId, academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }
  if (date.getTime() < session.startDate.getTime() || date.getTime() > session.endDate.getTime()) {
    throw new AttendanceDateOutsideSessionError();
  }

  const classEntity = await classRepository.findById(tenantId, classId);
  if (!classEntity || classEntity.deletedAt !== null || classEntity.academicSessionId !== session.id) {
    throw new InvalidClassError();
  }

  const section = await sectionRepository.findById(tenantId, sectionId);
  if (!section || section.deletedAt !== null || section.classId !== classEntity.id) {
    throw new InvalidSectionError();
  }

  return { session, classEntity, section };
}
