import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaVehicleRepository } from "../infrastructure/prisma-vehicle.repository";
import { VehicleAlreadyExistsError, VehicleNotFoundError } from "../domain/errors";
import { updateVehicleSchema, type VehicleDTO } from "./dto/vehicle.dto";
import { toVehicleDTO } from "./create-vehicle.service";
import type { TransportContext } from "./create-vehicle.service";

export async function updateVehicle(
  vehicleId: string,
  input: unknown,
  context: TransportContext
): Promise<VehicleDTO> {
  const parsed = updateVehicleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid vehicle data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaVehicleRepository();
  const existing = await repository.findById(tenantId, vehicleId);
  if (!existing || existing.deletedAt !== null) {
    throw new VehicleNotFoundError();
  }

  try {
    const vehicle = await repository.update(tenantId, vehicleId, {
      registrationNumber: data.registrationNumber,
      vehicleType: data.vehicleType,
      make: data.make,
      model: data.model,
      manufactureYear: data.manufactureYear,
      seatingCapacity: data.seatingCapacity,
      fuelType: data.fuelType,
      insuranceExpiryDate: data.insuranceExpiryDate,
      fitnessExpiryDate: data.fitnessExpiryDate,
      permitExpiryDate: data.permitExpiryDate,
      pollutionExpiryDate: data.pollutionExpiryDate,
      status: data.status,
      updatedBy: actingUserId,
    });
    return toVehicleDTO(vehicle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new VehicleAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteVehicle(vehicleId: string, context: TransportContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaVehicleRepository();
  const existing = await repository.findById(tenantId, vehicleId);
  if (!existing || existing.deletedAt !== null) {
    throw new VehicleNotFoundError();
  }
  await repository.softDelete(tenantId, vehicleId, actingUserId);
}
