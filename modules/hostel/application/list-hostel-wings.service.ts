import "server-only";
import { PrismaHostelWingRepository } from "../infrastructure/prisma-hostel-wing.repository";
import { toHostelWingDTO } from "./create-hostel-wing.service";
import type { HostelWingDTO } from "./dto/hostel-structure.dto";

export async function listHostelWings(context: { tenantId: string }, buildingId: string): Promise<HostelWingDTO[]> {
  const repository = new PrismaHostelWingRepository();
  const wings = await repository.findByBuilding(context.tenantId, buildingId);
  return wings.map(toHostelWingDTO);
}
