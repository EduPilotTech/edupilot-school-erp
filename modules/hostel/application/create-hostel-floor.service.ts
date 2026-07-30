import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelBuildingRepository } from "../infrastructure/prisma-hostel-building.repository";
import { PrismaHostelFloorRepository } from "../infrastructure/prisma-hostel-floor.repository";
import { HostelBuildingNotFoundError } from "../domain/errors";
import { createHostelFloorSchema, type HostelFloorDTO } from "./dto/hostel-structure.dto";
import type { HostelFloorEntity } from "../domain/hostel-floor.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: HostelFloorEntity): HostelFloorDTO {
  return {
    id: entity.id,
    buildingId: entity.buildingId,
    name: entity.name,
    floorNumber: entity.floorNumber,
    isActive: entity.isActive,
  };
}

export async function createHostelFloor(input: unknown, context: HostelContext): Promise<HostelFloorDTO> {
  const parsed = createHostelFloorSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid floor data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const buildingRepository = new PrismaHostelBuildingRepository();
  const building = await buildingRepository.findById(tenantId, data.buildingId);
  if (!building || building.deletedAt !== null) {
    throw new HostelBuildingNotFoundError();
  }

  const repository = new PrismaHostelFloorRepository();
  try {
    const floor = await repository.create({
      tenantId,
      buildingId: data.buildingId,
      name: data.name,
      floorNumber: data.floorNumber,
      createdBy: actingUserId,
    });
    return toDTO(floor);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ValidationError("A floor with this number already exists in this building.");
    }
    throw error;
  }
}

export { toDTO as toHostelFloorDTO };
