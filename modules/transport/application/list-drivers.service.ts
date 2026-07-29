import "server-only";
import { PrismaDriverRepository } from "../infrastructure/prisma-driver.repository";
import { toDriverDTO } from "./create-driver.service";
import type { DriverDTO } from "./dto/driver.dto";

export async function listDrivers(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<DriverDTO[]> {
  const repository = new PrismaDriverRepository();
  const drivers = await repository.findMany(context.tenantId, filter);
  return drivers.map(toDriverDTO);
}
