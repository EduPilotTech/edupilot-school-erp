import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaFeeStructureRepository } from "../infrastructure/prisma-fee-structure.repository";
import { FeeStructureAlreadyExistsError } from "../domain/errors";
import { createFeeStructureSchema, type FeeStructureDTO } from "./dto/fee-structure.dto";
import type { FeeStructureEntity } from "../domain/fee-structure.entity";

export interface FeeStructureContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: FeeStructureEntity): FeeStructureDTO {
  return {
    id: entity.id,
    academicSessionId: entity.academicSessionId,
    name: entity.name,
    isActive: entity.isActive,
  };
}

export async function createFeeStructure(input: unknown, context: FeeStructureContext): Promise<FeeStructureDTO> {
  const parsed = createFeeStructureSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fee structure data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const repository = new PrismaFeeStructureRepository();
  const existing = await repository.findByName(tenantId, data.academicSessionId, data.name);
  if (existing) {
    throw new FeeStructureAlreadyExistsError();
  }

  try {
    const structure = await repository.create({
      tenantId,
      academicSessionId: data.academicSessionId,
      name: data.name,
      createdBy: actingUserId,
    });
    return toDTO(structure);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FeeStructureAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toFeeStructureDTO };
