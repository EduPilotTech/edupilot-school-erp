import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelRepository } from "../infrastructure/prisma-hostel.repository";
import { PrismaHostelBuildingRepository } from "../infrastructure/prisma-hostel-building.repository";
import { HostelBuildingAlreadyExistsError, HostelNotFoundError } from "../domain/errors";
import { createHostelBuildingSchema, type HostelBuildingDTO } from "./dto/hostel-structure.dto";
import type { HostelBuildingEntity } from "../domain/hostel-building.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: HostelBuildingEntity): HostelBuildingDTO {
  return {
    id: entity.id,
    hostelId: entity.hostelId,
    name: entity.name,
    code: entity.code,
    isActive: entity.isActive,
  };
}

export async function createHostelBuilding(input: unknown, context: HostelContext): Promise<HostelBuildingDTO> {
  const parsed = createHostelBuildingSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid building data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const hostelRepository = new PrismaHostelRepository();
  const hostel = await hostelRepository.findById(tenantId, data.hostelId);
  if (!hostel || hostel.deletedAt !== null) {
    throw new HostelNotFoundError();
  }

  const repository = new PrismaHostelBuildingRepository();
  try {
    const building = await repository.create({
      tenantId,
      hostelId: data.hostelId,
      name: data.name,
      code: data.code,
      createdBy: actingUserId,
    });
    return toDTO(building);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HostelBuildingAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toHostelBuildingDTO };
