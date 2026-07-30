import "server-only";
import { PrismaHostelBuildingRepository } from "../infrastructure/prisma-hostel-building.repository";
import { toHostelBuildingDTO } from "./create-hostel-building.service";
import type { HostelBuildingDTO } from "./dto/hostel-structure.dto";

export async function listHostelBuildings(context: { tenantId: string }, hostelId: string): Promise<HostelBuildingDTO[]> {
  const repository = new PrismaHostelBuildingRepository();
  const buildings = await repository.findByHostel(context.tenantId, hostelId);
  return buildings.map(toHostelBuildingDTO);
}
