import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSectionRepository } from "../infrastructure/prisma-section.repository";
import { PrismaClassRepository } from "../infrastructure/prisma-class.repository";
import { ClassNotFoundError, SectionAlreadyExistsError } from "../domain/errors";
import { createSectionSchema, type SectionDTO } from "./dto/academic-section.dto";
import type { SectionEntity } from "../domain/section.entity";

export interface CreateSectionContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: SectionEntity): SectionDTO {
  return {
    id: entity.id,
    classId: entity.classId,
    name: entity.name,
    capacity: entity.capacity,
  };
}

// Academic Setup — third step of the flow: a Section must belong to an existing Class
// (CreateSectionInput.classId is a required FK), so this service verifies the class is real and
// tenant-owned before writing, mirroring create-class.service.ts's own session check.
export async function createSection(input: unknown, context: CreateSectionContext): Promise<SectionDTO> {
  const parsed = createSectionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid section data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const classRepository = new PrismaClassRepository();
  const classEntity = await classRepository.findById(tenantId, data.classId);
  if (!classEntity || classEntity.deletedAt) {
    throw new ClassNotFoundError();
  }

  const repository = new PrismaSectionRepository();
  try {
    const created = await repository.create({
      tenantId,
      classId: data.classId,
      name: data.name,
      capacity: data.capacity ?? null,
      createdBy: actingUserId,
    });
    return toDTO(created);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SectionAlreadyExistsError();
    }
    throw error;
  }
}
