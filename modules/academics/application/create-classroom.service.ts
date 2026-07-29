import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaClassroomRepository } from "../infrastructure/prisma-classroom.repository";
import { ClassroomAlreadyExistsError } from "../domain/errors";
import { createClassroomSchema, type ClassroomDTO } from "./dto/classroom.dto";

export interface CreateClassroomContext {
  tenantId: string;
  schoolId: string;
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

export async function createClassroom(input: unknown, context: CreateClassroomContext): Promise<ClassroomDTO> {
  const parsed = createClassroomSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid classroom data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaClassroomRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) {
    throw new ClassroomAlreadyExistsError();
  }

  try {
    const classroom = await repository.create({
      tenantId,
      schoolId,
      name: data.name,
      code: data.code,
      capacity: data.capacity ?? null,
      createdBy: actingUserId,
    });
    return toDTO(classroom);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ClassroomAlreadyExistsError();
    }
    throw error;
  }
}
