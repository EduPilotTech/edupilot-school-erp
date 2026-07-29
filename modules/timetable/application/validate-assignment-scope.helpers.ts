import "server-only";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaSectionRepository } from "@/modules/academics/infrastructure/prisma-section.repository";
import { PrismaSubjectRepository } from "@/modules/academics/infrastructure/prisma-subject.repository";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import {
  InvalidAcademicSessionError,
  InvalidClassError,
  InvalidSectionError,
} from "@/modules/students/domain/errors";
import { SubjectNotFoundError } from "@/modules/academics/domain/errors";
import { TeacherNotFoundError } from "@/modules/teachers/domain/errors";
import type { AcademicSessionEntity } from "@/modules/academics/domain/academic-session.entity";
import type { ClassEntity } from "@/modules/academics/domain/class.entity";
import type { SectionEntity } from "@/modules/academics/domain/section.entity";
import type { SubjectEntity } from "@/modules/academics/domain/subject.entity";
import type { TeacherEntity } from "@/modules/teachers/domain/teacher.entity";

export interface AssignmentScope {
  session: AcademicSessionEntity;
  classEntity: ClassEntity;
  section: SectionEntity;
  subject: SubjectEntity;
  teacher: TeacherEntity;
}

// Shared by assignTeacher and (indirectly, via TeacherAssignment) createTimetableEntry — resolves
// and validates that session/class/section/subject/teacher all exist, are not soft-deleted, and
// belong to each other/this tenant. Mirrors modules/attendance's validateAttendanceScope helper
// exactly.
export async function validateAssignmentScope(
  tenantId: string,
  academicSessionId: string,
  classId: string,
  sectionId: string,
  subjectId: string,
  teacherId: string
): Promise<AssignmentScope> {
  const sessionRepository = new PrismaAcademicSessionRepository();
  const classRepository = new PrismaClassRepository();
  const sectionRepository = new PrismaSectionRepository();
  const subjectRepository = new PrismaSubjectRepository();
  const teacherRepository = new PrismaTeacherRepository();

  const session = await sessionRepository.findById(tenantId, academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const classEntity = await classRepository.findById(tenantId, classId);
  if (!classEntity || classEntity.deletedAt !== null || classEntity.academicSessionId !== session.id) {
    throw new InvalidClassError();
  }

  const section = await sectionRepository.findById(tenantId, sectionId);
  if (!section || section.deletedAt !== null || section.classId !== classEntity.id) {
    throw new InvalidSectionError();
  }

  const subject = await subjectRepository.findById(tenantId, subjectId);
  if (!subject || subject.deletedAt !== null) {
    throw new SubjectNotFoundError();
  }

  const teacher = await teacherRepository.findById(tenantId, teacherId);
  if (!teacher || teacher.deletedAt !== null) {
    throw new TeacherNotFoundError();
  }

  return { session, classEntity, section, subject, teacher };
}
