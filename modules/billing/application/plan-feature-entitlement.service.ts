import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionPlanDefinitionRepository } from "../infrastructure/prisma-subscription-plan-definition.repository";
import { PrismaPlanFeatureEntitlementRepository } from "../infrastructure/prisma-plan-feature-entitlement.repository";
import {
  PlanFeatureEntitlementAlreadyExistsError,
  PlanFeatureEntitlementNotFoundError,
  SubscriptionPlanDefinitionNotFoundError,
} from "../domain/errors";
import { recordPlatformAudit } from "./billing-audit.helpers";
import {
  createPlanFeatureEntitlementSchema,
  updatePlanFeatureEntitlementSchema,
  type PlanFeatureEntitlementDTO,
} from "./dto/plan-feature-entitlement.dto";
import type { PlanFeatureEntitlementEntity } from "../domain/plan-feature-entitlement.entity";
import type { PlatformBillingContext } from "./billing-context";

function toDTO(entity: PlanFeatureEntitlementEntity): PlanFeatureEntitlementDTO {
  return {
    id: entity.id,
    subscriptionPlanDefinitionId: entity.subscriptionPlanDefinitionId,
    featureKey: entity.featureKey,
    valueType: entity.valueType,
    booleanValue: entity.booleanValue,
    limitValue: entity.limitValue,
  };
}

const planDefinitionRepository = new PrismaSubscriptionPlanDefinitionRepository();
const entitlementRepository = new PrismaPlanFeatureEntitlementRepository();

// Public catalog tier — same "no tx on the repository, sequential write + audit" shape as
// subscription-plan-definition.service.ts. Hard delete only, per the domain repository's own
// "no historical significance of its own" note (Subscription.plan already snapshots what a
// tenant had at assignment time).
export async function createPlanFeatureEntitlement(input: unknown, context: PlatformBillingContext): Promise<PlanFeatureEntitlementDTO> {
  const parsed = createPlanFeatureEntitlementSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid plan feature entitlement data.");
  }
  const data = parsed.data;
  const { actingUserId } = context;

  const plan = await planDefinitionRepository.findById(data.subscriptionPlanDefinitionId);
  if (!plan || plan.deletedAt !== null) {
    throw new SubscriptionPlanDefinitionNotFoundError();
  }

  const existing = await entitlementRepository.findByPlanDefinitionAndKey(data.subscriptionPlanDefinitionId, data.featureKey);
  if (existing) {
    throw new PlanFeatureEntitlementAlreadyExistsError();
  }

  try {
    const entitlement = await entitlementRepository.create({
      subscriptionPlanDefinitionId: data.subscriptionPlanDefinitionId,
      featureKey: data.featureKey,
      valueType: data.valueType,
      booleanValue: data.booleanValue ?? null,
      limitValue: data.limitValue ?? null,
    });

    await recordPlatformAudit({
      actorId: actingUserId,
      action: "PLAN_FEATURE_ENTITLEMENT_CREATED",
      entityType: "PlanFeatureEntitlement",
      entityId: entitlement.id,
      afterState: entitlement,
    });

    return toDTO(entitlement);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new PlanFeatureEntitlementAlreadyExistsError();
    }
    throw error;
  }
}

export async function updatePlanFeatureEntitlement(
  id: string,
  input: unknown,
  context: PlatformBillingContext
): Promise<PlanFeatureEntitlementDTO> {
  const parsed = updatePlanFeatureEntitlementSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid plan feature entitlement data.");
  }
  const data = parsed.data;
  const { actingUserId } = context;

  const existing = await entitlementRepository.findById(id);
  if (!existing) {
    throw new PlanFeatureEntitlementNotFoundError();
  }

  const updated = await entitlementRepository.update(id, data);

  await recordPlatformAudit({
    actorId: actingUserId,
    action: "PLAN_FEATURE_ENTITLEMENT_UPDATED",
    entityType: "PlanFeatureEntitlement",
    entityId: updated.id,
    beforeState: existing,
    afterState: updated,
  });

  return toDTO(updated);
}

export async function deletePlanFeatureEntitlement(id: string, context: PlatformBillingContext): Promise<void> {
  const { actingUserId } = context;

  const existing = await entitlementRepository.findById(id);
  if (!existing) {
    throw new PlanFeatureEntitlementNotFoundError();
  }

  await entitlementRepository.delete(id);

  await recordPlatformAudit({
    actorId: actingUserId,
    action: "PLAN_FEATURE_ENTITLEMENT_DELETED",
    entityType: "PlanFeatureEntitlement",
    entityId: id,
    beforeState: existing,
  });
}

export async function listPlanFeatureEntitlements(subscriptionPlanDefinitionId: string): Promise<PlanFeatureEntitlementDTO[]> {
  const entitlements = await entitlementRepository.findByPlanDefinition(subscriptionPlanDefinitionId);
  return entitlements.map(toDTO);
}

export { toDTO as toPlanFeatureEntitlementDTO };
