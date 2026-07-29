import { z } from "zod";

export const createDriverSchema = z.object({
  employeeCode: z.string().trim().min(1, "Employee code is required."),
  fullName: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(500).optional(),
  licenseNumber: z.string().trim().min(1, "License number is required."),
  licenseType: z.string().trim().max(50).optional(),
  licenseExpiryDate: z.coerce.date().optional(),
  dateOfJoining: z.coerce.date().optional(),
});
export type CreateDriverServiceInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  licenseNumber: z.string().trim().min(1).optional(),
  licenseType: z.string().trim().max(50).nullable().optional(),
  licenseExpiryDate: z.coerce.date().nullable().optional(),
  dateOfJoining: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDriverServiceInput = z.infer<typeof updateDriverSchema>;

export interface DriverDTO {
  id: string;
  userProfileId: string | null;
  employeeCode: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  licenseNumber: string;
  licenseType: string | null;
  licenseExpiryDate: string | null;
  dateOfJoining: string | null;
  isActive: boolean;
}
