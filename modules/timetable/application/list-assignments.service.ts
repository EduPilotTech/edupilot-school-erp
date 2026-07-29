import "server-only";
import { PrismaTeacherAssignmentRepository } from "../infrastructure/prisma-teacher-assignment.repository";
import type { TeacherAssignmentDTO } from "./dto/teacher-assignment.dto";

function toDTO(entity: {
  id: string;
  teacherId: string;
  subjectId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  isActive: boolean;
}): TeacherAssignmentDTO {
  return {
    id: entity.id,
    teacherId: entity.teacherId,
    subjectId: entity.subjectId,
    academicSessionId: entity.academicSessionId,
    classId: entity.classId,
    sectionId: entity.sectionId,
    isActive: entity.isActive,
  };
}

export async function listAssignmentsForTeacher(
  teacherId: string,
  academicSessionId: string,
  context: { tenantId: string }
): Promise<TeacherAssignmentDTO[]> {
  const repository = new PrismaTeacherAssignmentRepository();
  const rows = await repository.findByTeacher(context.tenantId, teacherId, academicSessionId);
  return rows.map(toDTO);
}

export async function listAssignmentsForClass(
  classId: string,
  sectionId: string,
  academicSessionId: string,
  context: { tenantId: string }
): Promise<TeacherAssignmentDTO[]> {
  const repository = new PrismaTeacherAssignmentRepository();
  const rows = await repository.findByClass(context.tenantId, classId, sectionId, academicSessionId);
  return rows.map(toDTO);
}
