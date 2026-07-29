import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaTeacherAssignmentRepository } from "../infrastructure/prisma-teacher-assignment.repository";
import { validateAssignmentScope } from "./validate-assignment-scope.helpers";
import { assignTeacherSchema, type TeacherAssignmentDTO } from "./dto/teacher-assignment.dto";

export interface AssignTeacherContext {
  tenantId: string;
  actingUserId: string;
}

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

// Upsert-based (see TeacherAssignment's own schema comment) — assigning an already-assigned
// combination just reactivates it (`isActive: true`) rather than erroring, so the required
// Teacher -> TeacherAssignment -> TimetableEntry flow (Phase 6 Decision 4) never gets stuck on a
// stale deactivated assignment.
export async function assignTeacher(input: unknown, context: AssignTeacherContext): Promise<TeacherAssignmentDTO> {
  const parsed = assignTeacherSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid assignment data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  await validateAssignmentScope(
    tenantId,
    data.academicSessionId,
    data.classId,
    data.sectionId,
    data.subjectId,
    data.teacherId
  );

  const repository = new PrismaTeacherAssignmentRepository();
  const assignment = await repository.upsertOne({
    tenantId,
    teacherId: data.teacherId,
    subjectId: data.subjectId,
    classId: data.classId,
    sectionId: data.sectionId,
    academicSessionId: data.academicSessionId,
    isActive: true,
    updatedBy: actingUserId,
  });

  return toDTO(assignment);
}
