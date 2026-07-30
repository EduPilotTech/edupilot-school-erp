import { z } from "zod";

export const createLibrarySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
  address: z.string().trim().max(500).optional(),
});
export type CreateLibraryServiceInput = z.infer<typeof createLibrarySchema>;

export const updateLibrarySchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  address: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateLibraryServiceInput = z.infer<typeof updateLibrarySchema>;

export interface LibraryDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
}

export const upsertLibrarySettingsSchema = z.object({
  defaultLoanPeriodDays: z.number().int().min(1).default(14),
  maxBooksStudent: z.number().int().min(0).default(3),
  maxBooksTeacher: z.number().int().min(0).default(5),
  maxBooksStaff: z.number().int().min(0).default(5),
  maxRenewalCount: z.number().int().min(0).default(2),
  reservationHoldDays: z.number().int().min(0).default(2),
});
export type UpsertLibrarySettingsServiceInput = z.infer<typeof upsertLibrarySettingsSchema>;

export interface LibrarySettingsDTO {
  id: string;
  libraryId: string;
  defaultLoanPeriodDays: number;
  maxBooksStudent: number;
  maxBooksTeacher: number;
  maxBooksStaff: number;
  maxRenewalCount: number;
  reservationHoldDays: number;
}
