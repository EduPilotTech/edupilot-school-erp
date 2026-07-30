import "server-only";
import { PrismaHostelBedRepository } from "../infrastructure/prisma-hostel-bed.repository";
import { toHostelBedDTO } from "./create-hostel-bed.service";
import type { HostelBedDTO } from "./dto/hostel-structure.dto";

export async function listHostelBedsByRoom(context: { tenantId: string }, roomId: string): Promise<HostelBedDTO[]> {
  const repository = new PrismaHostelBedRepository();
  const beds = await repository.findByRoom(context.tenantId, roomId);
  return beds.map(toHostelBedDTO);
}

export async function listVacantHostelBedsByRoom(context: { tenantId: string }, roomId: string): Promise<HostelBedDTO[]> {
  const repository = new PrismaHostelBedRepository();
  const beds = await repository.findVacantByRoom(context.tenantId, roomId);
  return beds.map(toHostelBedDTO);
}
