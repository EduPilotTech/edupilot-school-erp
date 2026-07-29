import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaClassroomRepository } from "../infrastructure/prisma-classroom.repository";
import { ClassroomAlreadyExistsError, ClassroomNotFoundError } from "../domain/errors";
import { updateClassroomSchema, type ClassroomDTO } from "./dto/classroom.dto";

export interface UpdateClassroomContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  capacity: number | null;
  isActive: boolean;
}): ClassroomDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    name: entity.name,
    code: entity.code,
    capacity: entity.capacity,
    isActive: entity.isActive,
  };
}

export async function updateClassroom(
  classroomId: string,
  input: unknown,
  context: UpdateClassroomContext
): Promise<ClassroomDTO> {
  const parsed = updateClassroomSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid classroom data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaClassroomRepository();
  const existing = await repository.findById(tenantId, classroomId);
  if (!existing || existing.deletedAt !== null) {
    throw new ClassroomNotFoundError();
  }

  try {
    const classroom = await repository.update(tenantId, classroomId, {
      name: data.name,
      code: data.code,
      capacity: data.capacity,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
    return toDTO(classroom);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ClassroomAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteClassroom(classroomId: string, context: UpdateClassroomContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaClassroomRepository();
  const existing = await repository.findById(tenantId, classroomId);
  if (!existing || existing.deletedAt !== null) {
    throw new ClassroomNotFoundError();
  }
  await repository.softDelete(tenantId, classroomId, actingUserId);
}
