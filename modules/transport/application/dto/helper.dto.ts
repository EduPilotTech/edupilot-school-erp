import { z } from "zod";

export const createHelperSchema = z.object({
  employeeCode: z.string().trim().min(1, "Employee code is required."),
  fullName: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(500).optional(),
  dateOfJoining: z.coerce.date().optional(),
});
export type CreateHelperServiceInput = z.infer<typeof createHelperSchema>;

export const updateHelperSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  dateOfJoining: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateHelperServiceInput = z.infer<typeof updateHelperSchema>;

export interface HelperDTO {
  id: string;
  userProfileId: string | null;
  employeeCode: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  dateOfJoining: string | null;
  isActive: boolean;
}
