import "server-only";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError, InvalidClassError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaSubjectRepository } from "@/modules/academics/infrastructure/prisma-subject.repository";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { SubjectNotFoundError } from "@/modules/academics/domain/errors";
import { TeacherNotFoundError } from "@/modules/teachers/domain/errors";
import { PrismaHomeworkRepository } from "../infrastructure/prisma-homework.repository";
import { createHomeworkSchema, type HomeworkDTO } from "./dto/homework.dto";
import type { HomeworkEntity } from "../domain/homework.entity";

export interface CreateHomeworkContext {
  tenantId: string;
  teacherId: string;
  actingUserId: string;
}

function toDTO(entity: HomeworkEntity): HomeworkDTO {
  return {
    id: entity.id,
    academicSessionId: entity.academicSessionId,
    classId: entity.classId,
    sectionId: entity.sectionId,
    subjectId: entity.subjectId,
    teacherId: entity.teacherId,
    title: entity.title,
    description: entity.description,
    assignedDate: entity.assignedDate.toISOString().slice(0, 10),
    dueDate: entity.dueDate.toISOString().slice(0, 10),
    attachmentKey: entity.attachmentKey,
    isActive: entity.isActive,
  };
}

// View-only this phase (Phase 9 Decision 3) — no student submission workflow, just the
// assignment record itself.
export async function createHomework(input: unknown, context: CreateHomeworkContext): Promise<HomeworkDTO> {
  const parsed = createHomeworkSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid homework data.");
  }
  const data = parsed.data;
  const { tenantId, teacherId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const classRepository = new PrismaClassRepository();
  const classEntity = await classRepository.findById(tenantId, data.classId);
  if (!classEntity || classEntity.deletedAt !== null) {
    throw new InvalidClassError();
  }

  const subjectRepository = new PrismaSubjectRepository();
  const subject = await subjectRepository.findById(tenantId, data.subjectId);
  if (!subject || subject.deletedAt !== null) {
    throw new SubjectNotFoundError();
  }

  const teacherRepository = new PrismaTeacherRepository();
  const teacher = await teacherRepository.findById(tenantId, teacherId);
  if (!teacher || teacher.deletedAt !== null) {
    throw new TeacherNotFoundError();
  }

  if (data.dueDate < data.assignedDate) {
    throw new ValidationError("Due date cannot be before the assigned date.");
  }

  const repository = new PrismaHomeworkRepository();
  const homework = await repository.create({
    tenantId,
    academicSessionId: data.academicSessionId,
    classId: data.classId,
    sectionId: data.sectionId ?? null,
    subjectId: data.subjectId,
    teacherId,
    title: data.title,
    description: data.description,
    assignedDate: data.assignedDate,
    dueDate: data.dueDate,
    attachmentKey: data.attachmentKey ?? null,
    createdBy: actingUserId,
  });

  return toDTO(homework);
}

export { toDTO as toHomeworkDTO };
