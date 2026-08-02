import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaClassRepository } from "../infrastructure/prisma-class.repository";
import { PrismaAcademicSessionRepository } from "../infrastructure/prisma-academic-session.repository";
import { AcademicSessionNotFoundError, ClassAlreadyExistsError } from "../domain/errors";
import { createClassSchema, type ClassDTO } from "./dto/academic-class.dto";
import type { ClassEntity } from "../domain/class.entity";

export interface CreateClassContext {
  tenantId: string;
  schoolId: string;
  actingUserId: string;
}

function toDTO(entity: ClassEntity): ClassDTO {
  return {
    id: entity.id,
    academicSessionId: entity.academicSessionId,
    name: entity.name,
    grade: entity.grade,
  };
}

// Academic Setup — second step of the flow: a Class must belong to an existing Academic Session
// (CreateClassInput.academicSessionId is a required FK), so this service verifies the session is
// real and tenant-owned before writing, rather than letting the FK constraint be the only guard.
export async function createClass(input: unknown, context: CreateClassContext): Promise<ClassDTO> {
  const parsed = createClassSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid class data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt) {
    throw new AcademicSessionNotFoundError();
  }

  const repository = new PrismaClassRepository();
  try {
    const created = await repository.create({
      tenantId,
      schoolId,
      academicSessionId: data.academicSessionId,
      name: data.name,
      grade: data.grade ?? null,
      createdBy: actingUserId,
    });
    return toDTO(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ClassAlreadyExistsError();
    }
    throw error;
  }
}
