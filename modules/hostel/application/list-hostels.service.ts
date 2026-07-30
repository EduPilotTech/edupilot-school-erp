import "server-only";
import { PrismaHostelRepository } from "../infrastructure/prisma-hostel.repository";
import { toHostelDTO } from "./create-hostel.service";
import type { HostelDTO } from "./dto/hostel.dto";

export async function listHostels(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<HostelDTO[]> {
  const repository = new PrismaHostelRepository();
  const hostels = await repository.findMany(context.tenantId, filter);
  return hostels.map(toHostelDTO);
}

export async function getHostel(tenantId: string, hostelId: string): Promise<HostelDTO | null> {
  const repository = new PrismaHostelRepository();
  const hostel = await repository.findById(tenantId, hostelId);
  return hostel ? toHostelDTO(hostel) : null;
}
