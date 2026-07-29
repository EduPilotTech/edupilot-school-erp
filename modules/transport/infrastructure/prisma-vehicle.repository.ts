import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Vehicle as PrismaVehicle } from "@/lib/generated/prisma/client";
import type { CreateVehicleInput, UpdateVehicleInput, VehicleRepository } from "../domain/vehicle.repository";
import type { VehicleEntity, VehicleStatusValue } from "../domain/vehicle.entity";

function toEntity(row: PrismaVehicle): VehicleEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    registrationNumber: row.registrationNumber,
    vehicleType: row.vehicleType,
    make: row.make,
    model: row.model,
    manufactureYear: row.manufactureYear,
    seatingCapacity: row.seatingCapacity,
    fuelType: row.fuelType,
    insuranceExpiryDate: row.insuranceExpiryDate,
    fitnessExpiryDate: row.fitnessExpiryDate,
    permitExpiryDate: row.permitExpiryDate,
    pollutionExpiryDate: row.pollutionExpiryDate,
    status: row.status,
    gpsDeviceId: row.gpsDeviceId,
    lastKnownLatitude: row.lastKnownLatitude ? row.lastKnownLatitude.toNumber() : null,
    lastKnownLongitude: row.lastKnownLongitude ? row.lastKnownLongitude.toNumber() : null,
    lastLocationAt: row.lastLocationAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaVehicleRepository implements VehicleRepository {
  async findById(tenantId: string, id: string): Promise<VehicleEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.vehicle.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByRegistrationNumber(tenantId: string, registrationNumber: string): Promise<VehicleEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.vehicle.findUnique({ where: { tenantId_registrationNumber: { tenantId, registrationNumber } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { status?: VehicleStatusValue }): Promise<VehicleEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.vehicle.findMany({
        where: { tenantId, deletedAt: null, status: filter?.status },
        orderBy: { registrationNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateVehicleInput): Promise<VehicleEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.vehicle.create({
        data: {
          tenantId: input.tenantId,
          registrationNumber: input.registrationNumber,
          vehicleType: input.vehicleType,
          make: input.make ?? null,
          model: input.model ?? null,
          manufactureYear: input.manufactureYear ?? null,
          seatingCapacity: input.seatingCapacity,
          fuelType: input.fuelType ?? null,
          insuranceExpiryDate: input.insuranceExpiryDate ?? null,
          fitnessExpiryDate: input.fitnessExpiryDate ?? null,
          permitExpiryDate: input.permitExpiryDate ?? null,
          pollutionExpiryDate: input.pollutionExpiryDate ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateVehicleInput): Promise<VehicleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.vehicle.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          registrationNumber: input.registrationNumber,
          vehicleType: input.vehicleType,
          make: input.make,
          model: input.model,
          manufactureYear: input.manufactureYear,
          seatingCapacity: input.seatingCapacity,
          fuelType: input.fuelType,
          insuranceExpiryDate: input.insuranceExpiryDate,
          fitnessExpiryDate: input.fitnessExpiryDate,
          permitExpiryDate: input.permitExpiryDate,
          pollutionExpiryDate: input.pollutionExpiryDate,
          status: input.status,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<VehicleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.vehicle.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), status: "INACTIVE", updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
