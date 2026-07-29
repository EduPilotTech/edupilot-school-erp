import { z } from "zod";

export const createFeeCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
  isRecurring: z.boolean().default(false),
  hsnSacCode: z.string().trim().max(50).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
});
export type CreateFeeCategoryServiceInput = z.infer<typeof createFeeCategorySchema>;

export const updateFeeCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isRecurring: z.boolean().optional(),
  hsnSacCode: z.string().trim().max(50).nullable().optional(),
  taxRatePercent: z.number().min(0).max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateFeeCategoryServiceInput = z.infer<typeof updateFeeCategorySchema>;

export interface FeeCategoryDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isRecurring: boolean;
  hsnSacCode: string | null;
  taxRatePercent: number | null;
  isActive: boolean;
}
