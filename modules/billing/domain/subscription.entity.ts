import type { SubscriptionPlanValue } from "./subscription-plan-definition.entity";

// Reuses the pre-existing SubscriptionStatus enum (already on Tenant, unused until this phase).
export type SubscriptionStatusValue = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
export type BillingCycleValue = "MONTHLY" | "ANNUAL";

// Tenant-owned, APPEND-ONLY (close-not-edit) — mirrors EmployeeSalaryAssignmentEntity exactly.
// A subscription change closes the current row (`effectiveTo`) and creates a new one; this row
// history IS the billing-cycle history requirement, no separate model needed. "Current" is the
// row with `effectiveTo IS NULL`. `plan`/`priceAtAssignment`/`currency` are snapshots taken at
// assignment time — they never rewrite if the catalog (SubscriptionPlanDefinition) changes later.
export interface SubscriptionEntity {
  id: string;
  tenantId: string;
  subscriptionPlanDefinitionId: string;
  plan: SubscriptionPlanValue;
  status: SubscriptionStatusValue;
  billingCycle: BillingCycleValue;
  priceAtAssignment: number;
  currency: string;
  autoRenew: boolean;
  trialEndsAt: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  gatewaySubscriptionId: string | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
