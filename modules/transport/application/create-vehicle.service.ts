import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaVehicleRepository } from "../infrastructure/prisma-vehicle.repository";
import { VehicleAlreadyExistsError } from "../domain/errors";
import { createVehicleSchema, type VehicleDTO } from "./dto/vehicle.dto";
import type { VehicleEntity } from "../domain/vehicle.entity";

export interface TransportContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: VehicleEntity): VehicleDTO {
  return {
    id: entity.id,
    registrationNumber: entity.registrationNumber,
    vehicleType: entity.vehicleType,
    make: entity.make,
    model: entity.model,
    manufactureYear: entity.manufactureYear,
    seatingCapacity: entity.seatingCapacity,
    fuelType: entity.fuelType,
    insuranceExpiryDate: entity.insuranceExpiryDate ? entity.insuranceExpiryDate.toISOString().slice(0, 10) : null,
    fitnessExpiryDate: entity.fitnessExpiryDate ? entity.fitnessExpiryDate.toISOString().slice(0, 10) : null,
    permitExpiryDate: entity.permitExpiryDate ? entity.permitExpiryDate.toISOString().slice(0, 10) : null,
    pollutionExpiryDate: entity.pollutionExpiryDate
      ? entity.pollutionExpiryDate.toISOString().slice(0, 10)
      : null,
    status: entity.status,
    gpsDeviceId: entity.gpsDeviceId,
    lastKnownLatitude: entity.lastKnownLatitude,
    lastKnownLongitude: entity.lastKnownLongitude,
    lastLocationAt: entity.lastLocationAt ? entity.lastLocationAt.toISOString() : null,
  };
}

export async function createVehicle(input: unknown, context: TransportContext): Promise<VehicleDTO> {
  const parsed = createVehicleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid vehicle data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaVehicleRepository();
  const existing = await repository.findByRegistrationNumber(tenantId, data.registrationNumber);
  if (existing) {
    throw new VehicleAlreadyExistsError();
  }

  try {
    const vehicle = await repository.create({
      tenantId,
      registrationNumber: data.registrationNumber,
      vehicleType: data.vehicleType,
      make: data.make ?? null,
      model: data.model ?? null,
      manufactureYear: data.manufactureYear ?? null,
      seatingCapacity: data.seatingCapacity,
      fuelType: data.fuelType ?? null,
      insuranceExpiryDate: data.insuranceExpiryDate ?? null,
      fitnessExpiryDate: data.fitnessExpiryDate ?? null,
      permitExpiryDate: data.permitExpiryDate ?? null,
      pollutionExpiryDate: data.pollutionExpiryDate ?? null,
      createdBy: actingUserId,
    });
    return toDTO(vehicle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new VehicleAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toVehicleDTO };
