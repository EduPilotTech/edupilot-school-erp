export type VehicleTypeValue = "BUS" | "MINI_BUS" | "VAN" | "OTHER";
export type FuelTypeValue = "DIESEL" | "PETROL" | "CNG" | "ELECTRIC" | "OTHER";

// Decision 7 — operationally distinct fleet states, not a plain isActive boolean.
export type VehicleStatusValue = "ACTIVE" | "MAINTENANCE" | "BREAKDOWN" | "INACTIVE";

// Tenant-scoped fleet vehicle. lastKnownLatitude/Longitude/lastLocationAt/gpsDeviceId are
// reserved for future live GPS tracking (Decision 11) — always null this phase, no write path.
export interface VehicleEntity {
  id: string;
  tenantId: string;
  registrationNumber: string;
  vehicleType: VehicleTypeValue;
  make: string | null;
  model: string | null;
  manufactureYear: number | null;
  seatingCapacity: number;
  fuelType: FuelTypeValue | null;
  insuranceExpiryDate: Date | null;
  fitnessExpiryDate: Date | null;
  permitExpiryDate: Date | null;
  pollutionExpiryDate: Date | null;
  status: VehicleStatusValue;
  gpsDeviceId: string | null;
  lastKnownLatitude: number | null;
  lastKnownLongitude: number | null;
  lastLocationAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
}
