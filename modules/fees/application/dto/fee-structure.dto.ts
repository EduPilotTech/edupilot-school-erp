import { z } from "zod";
import type { FeeFrequencyValue } from "../../domain/fee-structure.entity";

export const createFeeStructureSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  name: z.string().trim().min(1, "Name is required."),
});
export type CreateFeeStructureServiceInput = z.infer<typeof createFeeStructureSchema>;

export interface FeeStructureDTO {
  id: string;
  academicSessionId: string;
  name: string;
  isActive: boolean;
}

const feeFrequencyEnum = z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL", "INSTALLMENT"]);

export const addFeeStructureItemSchema = z.object({
  feeStructureId: z.string().uuid("Fee structure is required."),
  classId: z.string().uuid("Class is required."),
  feeCategoryId: z.string().uuid("Fee category is required."),
  amount: z.number().positive("Amount must be greater than zero."),
  frequency: feeFrequencyEnum,
  dueDayOfMonth: z.number().int().min(1).max(28).optional(),
});
export type AddFeeStructureItemServiceInput = z.infer<typeof addFeeStructureItemSchema>;

export const updateFeeStructureItemSchema = z.object({
  amount: z.number().positive().optional(),
  frequency: feeFrequencyEnum.optional(),
  dueDayOfMonth: z.number().int().min(1).max(28).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateFeeStructureItemServiceInput = z.infer<typeof updateFeeStructureItemSchema>;

export interface FeeStructureItemDTO {
  id: string;
  feeStructureId: string;
  classId: string;
  feeCategoryId: string;
  amount: number;
  frequency: FeeFrequencyValue;
  dueDayOfMonth: number | null;
  isActive: boolean;
}
