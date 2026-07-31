import { z } from "zod";

// --- Income Category ---------------------------------------------------------------------------

export const createIncomeCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateIncomeCategoryServiceInput = z.infer<typeof createIncomeCategorySchema>;

export const updateIncomeCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateIncomeCategoryServiceInput = z.infer<typeof updateIncomeCategorySchema>;

export interface IncomeCategoryDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
}

// --- Expense Category --------------------------------------------------------------------------

export const createExpenseCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  code: z.string().trim().min(1, "Code is required."),
});
export type CreateExpenseCategoryServiceInput = z.infer<typeof createExpenseCategorySchema>;

export const updateExpenseCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateExpenseCategoryServiceInput = z.infer<typeof updateExpenseCategorySchema>;

export interface ExpenseCategoryDTO {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  isActive: boolean;
}
