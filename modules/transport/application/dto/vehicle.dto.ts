import { z } from "zod";

const vehicleTypeEnum = z.enum(["BUS", "MINI_BUS", "VAN", "OTHER"]);
const fuelTypeEnum = z.enum(["DIESEL", "PETROL", "CNG", "ELECTRIC", "OTHER"]);
const vehicleStatusEnum = z.enum(["ACTIVE", "MAINTENANCE", "BREAKDOWN", "INACTIVE"]);

export const createVehicleSchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number is required."),
  vehicleType: vehicleTypeEnum,
  make: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  manufactureYear: z.number().int().min(1980).max(2100).optional(),
  seatingCapacity: z.number().int().min(1, "Seating capacity must be at least 1."),
  fuelType: fuelTypeEnum.optional(),
  insuranceExpiryDate: z.coerce.date().optional(),
  fitnessExpiryDate: z.coerce.date().optional(),
  permitExpiryDate: z.coerce.date().optional(),
  pollutionExpiryDate: z.coerce.date().optional(),
});
export type CreateVehicleServiceInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = z.object({
  registrationNumber: z.string().trim().min(1).optional(),
  vehicleType: vehicleTypeEnum.optional(),
  make: z.string().trim().max(100).nullable().optional(),
  model: z.string().trim().max(100).nullable().optional(),
  manufactureYear: z.number().int().min(1980).max(2100).nullable().optional(),
  seatingCapacity: z.number().int().min(1).optional(),
  fuelType: fuelTypeEnum.nullable().optional(),
  insuranceExpiryDate: z.coerce.date().nullable().optional(),
  fitnessExpiryDate: z.coerce.date().nullable().optional(),
  permitExpiryDate: z.coerce.date().nullable().optional(),
  pollutionExpiryDate: z.coerce.date().nullable().optional(),
  status: vehicleStatusEnum.optional(),
});
export type UpdateVehicleServiceInput = z.infer<typeof updateVehicleSchema>;

export interface VehicleDTO {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  make: string | null;
  model: string | null;
  manufactureYear: number | null;
  seatingCapacity: number;
  fuelType: string | null;
  insuranceExpiryDate: string | null;
  fitnessExpiryDate: string | null;
  permitExpiryDate: string | null;
  pollutionExpiryDate: string | null;
  status: string;
  gpsDeviceId: string | null;
  lastKnownLatitude: number | null;
  lastKnownLongitude: number | null;
  lastLocationAt: string | null;
}
