import type { PlanFeatureEntitlementEntity, PlanFeatureValueTypeValue } from "./plan-feature-entitlement.entity";

export interface CreatePlanFeatureEntitlementInput {
  subscriptionPlanDefinitionId: string;
  featureKey: string;
  valueType: PlanFeatureValueTypeValue;
  booleanValue?: boolean | null;
  limitValue?: number | null;
}

export interface UpdatePlanFeatureEntitlementInput {
  valueType?: PlanFeatureValueTypeValue;
  booleanValue?: boolean | null;
  limitValue?: number | null;
}

// Public catalog tier — no tenantId on any method (see subscription-plan-definition.repository.ts's
// own note). Hard delete only, per the schema's own "no historical significance" design.
export interface PlanFeatureEntitlementRepository {
  findById(id: string): Promise<PlanFeatureEntitlementEntity | null>;
  findByPlanDefinition(subscriptionPlanDefinitionId: string): Promise<PlanFeatureEntitlementEntity[]>;
  findByPlanDefinitionAndKey(subscriptionPlanDefinitionId: string, featureKey: string): Promise<PlanFeatureEntitlementEntity | null>;
  create(input: CreatePlanFeatureEntitlementInput): Promise<PlanFeatureEntitlementEntity>;
  update(id: string, input: UpdatePlanFeatureEntitlementInput): Promise<PlanFeatureEntitlementEntity>;
  delete(id: string): Promise<void>;
}
