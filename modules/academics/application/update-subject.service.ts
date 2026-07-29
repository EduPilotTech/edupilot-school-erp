import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSubjectRepository } from "../infrastructure/prisma-subject.repository";
import { SubjectAlreadyExistsError, SubjectNotFoundError } from "../domain/errors";
import { updateSubjectSchema, type SubjectDTO } from "./dto/subject.dto";

export interface UpdateSubjectContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: { id: string; schoolId: string; name: string; code: string; isActive: boolean }): SubjectDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function updateSubject(
  subjectId: string,
  input: unknown,
  context: UpdateSubjectContext
): Promise<SubjectDTO> {
  const parsed = updateSubjectSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid subject data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaSubjectRepository();
  const existing = await repository.findById(tenantId, subjectId);
  if (!existing || existing.deletedAt !== null) {
    throw new SubjectNotFoundError();
  }

  try {
    const subject = await repository.update(tenantId, subjectId, {
      name: data.name,
      code: data.code,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
    return toDTO(subject);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SubjectAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteSubject(subjectId: string, context: UpdateSubjectContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaSubjectRepository();
  const existing = await repository.findById(tenantId, subjectId);
  if (!existing || existing.deletedAt !== null) {
    throw new SubjectNotFoundError();
  }
  await repository.softDelete(tenantId, subjectId, actingUserId);
}
