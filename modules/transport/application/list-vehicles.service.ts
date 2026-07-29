import "server-only";
import { PrismaVehicleRepository } from "../infrastructure/prisma-vehicle.repository";
import { toVehicleDTO } from "./create-vehicle.service";
import type { VehicleDTO } from "./dto/vehicle.dto";
import type { VehicleStatusValue } from "../domain/vehicle.entity";

export async function listVehicles(
  context: { tenantId: string },
  filter?: { status?: VehicleStatusValue }
): Promise<VehicleDTO[]> {
  const repository = new PrismaVehicleRepository();
  const vehicles = await repository.findMany(context.tenantId, filter);
  return vehicles.map(toVehicleDTO);
}
