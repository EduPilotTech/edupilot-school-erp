export type PlanFeatureValueTypeValue = "BOOLEAN" | "LIMIT";

// Flat key/value entitlement per plan — no tenantId (public catalog tier) and no soft delete (a
// pure definition row with no historical significance of its own; Subscription.plan already
// snapshots what a tenant had at assignment time — see the schema's own comment).
export interface PlanFeatureEntitlementEntity {
  id: string;
  subscriptionPlanDefinitionId: string;
  featureKey: string;
  valueType: PlanFeatureValueTypeValue;
  booleanValue: boolean | null;
  limitValue: number | null;
  createdAt: Date;
  updatedAt: Date;
}
