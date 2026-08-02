import type { SubscriptionPlanDefinitionEntity, SubscriptionPlanValue } from "./subscription-plan-definition.entity";

export interface CreateSubscriptionPlanDefinitionInput {
  planCode: SubscriptionPlanValue;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  annualPrice: number;
  currency?: string;
  trialDays?: number;
  createdBy?: string | null;
}

export interface UpdateSubscriptionPlanDefinitionInput {
  name?: string;
  description?: string | null;
  monthlyPrice?: number;
  annualPrice?: number;
  currency?: string;
  trialDays?: number;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface SubscriptionPlanDefinitionFilter {
  isActive?: boolean;
}

// No tenantId on any method — this is the public catalog tier (see the module-level brief). Every
// tenant reads the same rows; only platform staff mutate them.
export interface SubscriptionPlanDefinitionRepository {
  findById(id: string): Promise<SubscriptionPlanDefinitionEntity | null>;
  findByPlanCode(planCode: SubscriptionPlanValue): Promise<SubscriptionPlanDefinitionEntity | null>;
  findAll(filter?: SubscriptionPlanDefinitionFilter): Promise<SubscriptionPlanDefinitionEntity[]>;
  create(input: CreateSubscriptionPlanDefinitionInput): Promise<SubscriptionPlanDefinitionEntity>;
  update(id: string, input: UpdateSubscriptionPlanDefinitionInput): Promise<SubscriptionPlanDefinitionEntity>;
  // Soft delete — mirrors BookRepository.softDelete exactly: sets `deletedAt` and `isActive = false`.
  softDelete(id: string, deletedBy: string | null): Promise<SubscriptionPlanDefinitionEntity>;
}
