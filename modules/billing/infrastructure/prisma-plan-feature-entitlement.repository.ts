import "server-only";
import { prisma } from "@/lib/prisma";
import type { PlanFeatureEntitlement as PrismaPlanFeatureEntitlement } from "@/lib/generated/prisma/client";
import type {
  CreatePlanFeatureEntitlementInput,
  PlanFeatureEntitlementRepository,
  UpdatePlanFeatureEntitlementInput,
} from "../domain/plan-feature-entitlement.repository";
import type { PlanFeatureEntitlementEntity, PlanFeatureValueTypeValue } from "../domain/plan-feature-entitlement.entity";

// Public catalog tier — direct `prisma` client, same reasoning as
// prisma-subscription-plan-definition.repository.ts (no tenantId column on this table).
export function toEntity(row: PrismaPlanFeatureEntitlement): PlanFeatureEntitlementEntity {
  return {
    id: row.id,
    subscriptionPlanDefinitionId: row.subscriptionPlanDefinitionId,
    featureKey: row.featureKey,
    valueType: row.valueType as PlanFeatureValueTypeValue,
    booleanValue: row.booleanValue,
    limitValue: row.limitValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaPlanFeatureEntitlementRepository implements PlanFeatureEntitlementRepository {
  async findById(id: string): Promise<PlanFeatureEntitlementEntity | null> {
    const row = await prisma.planFeatureEntitlement.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByPlanDefinition(subscriptionPlanDefinitionId: string): Promise<PlanFeatureEntitlementEntity[]> {
    const rows = await prisma.planFeatureEntitlement.findMany({
      where: { subscriptionPlanDefinitionId },
      orderBy: { featureKey: "asc" },
    });
    return rows.map(toEntity);
  }

  async findByPlanDefinitionAndKey(
    subscriptionPlanDefinitionId: string,
    featureKey: string
  ): Promise<PlanFeatureEntitlementEntity | null> {
    const row = await prisma.planFeatureEntitlement.findUnique({
      where: { subscriptionPlanDefinitionId_featureKey: { subscriptionPlanDefinitionId, featureKey } },
    });
    return row ? toEntity(row) : null;
  }

  async create(input: CreatePlanFeatureEntitlementInput): Promise<PlanFeatureEntitlementEntity> {
    const row = await prisma.planFeatureEntitlement.create({
      data: {
        subscriptionPlanDefinitionId: input.subscriptionPlanDefinitionId,
        featureKey: input.featureKey,
        valueType: input.valueType,
        booleanValue: input.booleanValue ?? null,
        limitValue: input.limitValue ?? null,
      },
    });
    return toEntity(row);
  }

  async update(id: string, input: UpdatePlanFeatureEntitlementInput): Promise<PlanFeatureEntitlementEntity> {
    const row = await prisma.planFeatureEntitlement.update({
      where: { id },
      data: {
        valueType: input.valueType,
        booleanValue: input.booleanValue,
        limitValue: input.limitValue,
      },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.planFeatureEntitlement.delete({ where: { id } });
  }
}
