import { z } from "zod";
import type { BillingCycleValue, SubscriptionStatusValue } from "../../domain/subscription.entity";
import type { SubscriptionPlanValue } from "../../domain/subscription-plan-definition.entity";

const billingCycleEnum = z.enum(["MONTHLY", "ANNUAL"]);

// `tenantId` deliberately absent — it comes from BillingContext, mirroring
// assignSalarySchema's own "tenantId comes from context, not from the caller's payload" pattern.
export const createSubscriptionSchema = z.object({
  subscriptionPlanDefinitionId: z.string().uuid("Plan is required."),
  billingCycle: billingCycleEnum,
  effectiveFrom: z.coerce.date(),
  autoRenew: z.boolean().optional(),
});
export type CreateSubscriptionServiceInput = z.infer<typeof createSubscriptionSchema>;

export const cancelSubscriptionSchema = z.object({
  reason: z.string().trim().min(1, "A cancellation reason is required.").max(500),
});
export type CancelSubscriptionServiceInput = z.infer<typeof cancelSubscriptionSchema>;

export interface SubscriptionDTO {
  id: string;
  tenantId: string;
  subscriptionPlanDefinitionId: string;
  plan: SubscriptionPlanValue;
  status: SubscriptionStatusValue;
  billingCycle: BillingCycleValue;
  priceAtAssignment: number;
  currency: string;
  autoRenew: boolean;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}
