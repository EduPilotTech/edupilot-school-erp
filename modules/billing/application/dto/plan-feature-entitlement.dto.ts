import { z } from "zod";
import type { PlanFeatureValueTypeValue } from "../../domain/plan-feature-entitlement.entity";

const valueTypeEnum = z.enum(["BOOLEAN", "LIMIT"]);

export const createPlanFeatureEntitlementSchema = z
  .object({
    subscriptionPlanDefinitionId: z.string().uuid("Plan is required."),
    featureKey: z.string().trim().min(1, "Feature key is required.").max(100),
    valueType: valueTypeEnum,
    booleanValue: z.boolean().optional(),
    limitValue: z.number().int().nonnegative("Limit cannot be negative.").optional(),
  })
  .refine((data) => data.valueType !== "BOOLEAN" || data.booleanValue !== undefined, {
    message: "A boolean value is required for a BOOLEAN entitlement.",
    path: ["booleanValue"],
  })
  .refine((data) => data.valueType !== "LIMIT" || data.limitValue !== undefined, {
    message: "A limit value is required for a LIMIT entitlement.",
    path: ["limitValue"],
  });
export type CreatePlanFeatureEntitlementServiceInput = z.infer<typeof createPlanFeatureEntitlementSchema>;

export const updatePlanFeatureEntitlementSchema = z.object({
  valueType: valueTypeEnum.optional(),
  booleanValue: z.boolean().optional(),
  limitValue: z.number().int().nonnegative().optional(),
});
export type UpdatePlanFeatureEntitlementServiceInput = z.infer<typeof updatePlanFeatureEntitlementSchema>;

export interface PlanFeatureEntitlementDTO {
  id: string;
  subscriptionPlanDefinitionId: string;
  featureKey: string;
  valueType: PlanFeatureValueTypeValue;
  booleanValue: boolean | null;
  limitValue: number | null;
}
