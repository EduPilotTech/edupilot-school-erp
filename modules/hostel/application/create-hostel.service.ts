import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelRepository } from "../infrastructure/prisma-hostel.repository";
import { HostelAlreadyExistsError } from "../domain/errors";
import { createHostelSchema, type HostelDTO } from "./dto/hostel.dto";
import type { HostelEntity } from "../domain/hostel.entity";

export interface HostelContext {
  tenantId: string;
  actingUserId: string;
}

export interface HostelCreateContext extends HostelContext {
  schoolId: string;
}

function toDTO(entity: HostelEntity): HostelDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    name: entity.name,
    code: entity.code,
    type: entity.type,
    address: entity.address,
    isActive: entity.isActive,
  };
}

export async function createHostel(input: unknown, context: HostelCreateContext): Promise<HostelDTO> {
  const parsed = createHostelSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid hostel data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaHostelRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) {
    throw new HostelAlreadyExistsError();
  }

  try {
    const hostel = await repository.create({
      tenantId,
      schoolId,
      name: data.name,
      code: data.code,
      type: data.type,
      address: data.address ?? null,
      createdBy: actingUserId,
    });
    return toDTO(hostel);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HostelAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toHostelDTO };
