import { z } from "zod";
import type { FineTypeValue } from "../../domain/fine-rule.entity";

const fineTypeEnum = z.enum(["FLAT", "PERCENTAGE", "PER_DAY"]);

export const createFineRuleSchema = z.object({
  academicSessionId: z.string().uuid("Academic session is required."),
  feeCategoryId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required."),
  gracePeriodDays: z.number().int().min(0),
  fineType: fineTypeEnum,
  fineValue: z.number().positive("Fine value must be greater than zero."),
  maxFineAmount: z.number().positive().optional(),
});
export type CreateFineRuleServiceInput = z.infer<typeof createFineRuleSchema>;

export const updateFineRuleSchema = z.object({
  name: z.string().trim().min(1).optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  fineType: fineTypeEnum.optional(),
  fineValue: z.number().positive().optional(),
  maxFineAmount: z.number().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateFineRuleServiceInput = z.infer<typeof updateFineRuleSchema>;

export interface FineRuleDTO {
  id: string;
  academicSessionId: string;
  feeCategoryId: string | null;
  name: string;
  gracePeriodDays: number;
  fineType: FineTypeValue;
  fineValue: number;
  maxFineAmount: number | null;
  isActive: boolean;
}
