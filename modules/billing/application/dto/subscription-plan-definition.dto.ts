import { z } from "zod";
import type { SubscriptionPlanValue } from "../../domain/subscription-plan-definition.entity";

const planCodeEnum = z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]);

export const createSubscriptionPlanDefinitionSchema = z.object({
  planCode: planCodeEnum,
  name: z.string().trim().min(1, "Plan name is required.").max(100),
  description: z.string().trim().max(1000).optional(),
  monthlyPrice: z.number().nonnegative("Monthly price cannot be negative."),
  annualPrice: z.number().nonnegative("Annual price cannot be negative."),
  currency: z.string().trim().length(3, "Currency must be a 3-letter ISO code.").optional(),
  trialDays: z.number().int().nonnegative("Trial days cannot be negative.").optional(),
});
export type CreateSubscriptionPlanDefinitionServiceInput = z.infer<typeof createSubscriptionPlanDefinitionSchema>;

export const updateSubscriptionPlanDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  monthlyPrice: z.number().nonnegative().optional(),
  annualPrice: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  trialDays: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSubscriptionPlanDefinitionServiceInput = z.infer<typeof updateSubscriptionPlanDefinitionSchema>;

export interface SubscriptionPlanDefinitionDTO {
  id: string;
  planCode: SubscriptionPlanValue;
  name: string;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  trialDays: number;
  isActive: boolean;
}
