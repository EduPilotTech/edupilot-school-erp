import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelFloorRepository } from "../infrastructure/prisma-hostel-floor.repository";
import { HostelFloorNotFoundError } from "../domain/errors";
import { updateHostelFloorSchema, type HostelFloorDTO } from "./dto/hostel-structure.dto";
import { toHostelFloorDTO } from "./create-hostel-floor.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateHostelFloor(
  floorId: string,
  input: unknown,
  context: HostelContext
): Promise<HostelFloorDTO> {
  const parsed = updateHostelFloorSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid floor data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHostelFloorRepository();
  const existing = await repository.findById(tenantId, floorId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelFloorNotFoundError();
  }

  const floor = await repository.update(tenantId, floorId, {
    name: data.name,
    floorNumber: data.floorNumber,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toHostelFloorDTO(floor);
}

export async function deleteHostelFloor(floorId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelFloorRepository();
  const existing = await repository.findById(tenantId, floorId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelFloorNotFoundError();
  }
  await repository.softDelete(tenantId, floorId, actingUserId);
}
