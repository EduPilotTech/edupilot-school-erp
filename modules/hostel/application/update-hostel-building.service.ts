import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelBuildingRepository } from "../infrastructure/prisma-hostel-building.repository";
import { HostelBuildingAlreadyExistsError, HostelBuildingNotFoundError } from "../domain/errors";
import { updateHostelBuildingSchema, type HostelBuildingDTO } from "./dto/hostel-structure.dto";
import { toHostelBuildingDTO } from "./create-hostel-building.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateHostelBuilding(
  buildingId: string,
  input: unknown,
  context: HostelContext
): Promise<HostelBuildingDTO> {
  const parsed = updateHostelBuildingSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid building data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHostelBuildingRepository();
  const existing = await repository.findById(tenantId, buildingId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelBuildingNotFoundError();
  }

  try {
    const building = await repository.update(tenantId, buildingId, {
      name: data.name,
      code: data.code,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
    return toHostelBuildingDTO(building);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HostelBuildingAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteHostelBuilding(buildingId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelBuildingRepository();
  const existing = await repository.findById(tenantId, buildingId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelBuildingNotFoundError();
  }
  await repository.softDelete(tenantId, buildingId, actingUserId);
}
