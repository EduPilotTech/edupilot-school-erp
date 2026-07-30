import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelBuildingRepository } from "../infrastructure/prisma-hostel-building.repository";
import { PrismaHostelWingRepository } from "../infrastructure/prisma-hostel-wing.repository";
import { HostelBuildingNotFoundError } from "../domain/errors";
import { createHostelWingSchema, type HostelWingDTO } from "./dto/hostel-structure.dto";
import type { HostelWingEntity } from "../domain/hostel-wing.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: HostelWingEntity): HostelWingDTO {
  return {
    id: entity.id,
    buildingId: entity.buildingId,
    name: entity.name,
    isActive: entity.isActive,
  };
}

export async function createHostelWing(input: unknown, context: HostelContext): Promise<HostelWingDTO> {
  const parsed = createHostelWingSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid wing data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const buildingRepository = new PrismaHostelBuildingRepository();
  const building = await buildingRepository.findById(tenantId, data.buildingId);
  if (!building || building.deletedAt !== null) {
    throw new HostelBuildingNotFoundError();
  }

  const repository = new PrismaHostelWingRepository();
  try {
    const wing = await repository.create({
      tenantId,
      buildingId: data.buildingId,
      name: data.name,
      createdBy: actingUserId,
    });
    return toDTO(wing);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ValidationError("A wing with this name already exists in this building.");
    }
    throw error;
  }
}

export { toDTO as toHostelWingDTO };
