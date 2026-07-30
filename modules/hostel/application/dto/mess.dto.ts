import { z } from "zod";

export const createMessMealPlanSchema = z.object({
  hostelId: z.string().uuid("Hostel is required."),
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().max(1000).optional(),
});
export type CreateMessMealPlanServiceInput = z.infer<typeof createMessMealPlanSchema>;

export const updateMessMealPlanSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateMessMealPlanServiceInput = z.infer<typeof updateMessMealPlanSchema>;

export interface MessMealPlanDTO {
  id: string;
  hostelId: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

const mealTypeEnum = z.enum(["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]);
const dietTypeEnum = z.enum(["VEG", "NON_VEG", "JAIN", "VEGAN", "OTHER"]);

export const createMessMealSchema = z.object({
  mealPlanId: z.string().uuid("Meal plan is required."),
  mealType: mealTypeEnum,
  dietType: dietTypeEnum,
  description: z.string().trim().max(1000).optional(),
});
export type CreateMessMealServiceInput = z.infer<typeof createMessMealSchema>;

export const updateMessMealSchema = z.object({
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateMessMealServiceInput = z.infer<typeof updateMessMealSchema>;

export interface MessMealDTO {
  id: string;
  mealPlanId: string;
  mealType: string;
  dietType: string;
  description: string | null;
  isActive: boolean;
}
