import "server-only";
import { PrismaHostelFloorRepository } from "../infrastructure/prisma-hostel-floor.repository";
import { toHostelFloorDTO } from "./create-hostel-floor.service";
import type { HostelFloorDTO } from "./dto/hostel-structure.dto";

export async function listHostelFloors(context: { tenantId: string }, buildingId: string): Promise<HostelFloorDTO[]> {
  const repository = new PrismaHostelFloorRepository();
  const floors = await repository.findByBuilding(context.tenantId, buildingId);
  return floors.map(toHostelFloorDTO);
}
