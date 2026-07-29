import type { VehicleEntity, VehicleStatusValue, VehicleTypeValue, FuelTypeValue } from "./vehicle.entity";

export interface CreateVehicleInput {
  tenantId: string;
  registrationNumber: string;
  vehicleType: VehicleTypeValue;
  make?: string | null;
  model?: string | null;
  manufactureYear?: number | null;
  seatingCapacity: number;
  fuelType?: FuelTypeValue | null;
  insuranceExpiryDate?: Date | null;
  fitnessExpiryDate?: Date | null;
  permitExpiryDate?: Date | null;
  pollutionExpiryDate?: Date | null;
  createdBy?: string | null;
}

export interface UpdateVehicleInput {
  registrationNumber?: string;
  vehicleType?: VehicleTypeValue;
  make?: string | null;
  model?: string | null;
  manufactureYear?: number | null;
  seatingCapacity?: number;
  fuelType?: FuelTypeValue | null;
  insuranceExpiryDate?: Date | null;
  fitnessExpiryDate?: Date | null;
  permitExpiryDate?: Date | null;
  pollutionExpiryDate?: Date | null;
  status?: VehicleStatusValue;
  updatedBy?: string | null;
}

export interface VehicleRepository {
  findById(tenantId: string, id: string): Promise<VehicleEntity | null>;
  findByRegistrationNumber(tenantId: string, registrationNumber: string): Promise<VehicleEntity | null>;
  findMany(tenantId: string, filter?: { status?: VehicleStatusValue }): Promise<VehicleEntity[]>;
  create(input: CreateVehicleInput): Promise<VehicleEntity>;
  update(tenantId: string, id: string, input: UpdateVehicleInput): Promise<VehicleEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<VehicleEntity>;
}
