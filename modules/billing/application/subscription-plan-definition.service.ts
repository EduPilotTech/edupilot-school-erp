import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionPlanDefinitionRepository } from "../infrastructure/prisma-subscription-plan-definition.repository";
import { SubscriptionPlanDefinitionAlreadyExistsError, SubscriptionPlanDefinitionNotFoundError } from "../domain/errors";
import { recordPlatformAudit } from "./billing-audit.helpers";
import {
  createSubscriptionPlanDefinitionSchema,
  updateSubscriptionPlanDefinitionSchema,
  type SubscriptionPlanDefinitionDTO,
} from "./dto/subscription-plan-definition.dto";
import type { SubscriptionPlanDefinitionEntity } from "../domain/subscription-plan-definition.entity";
import type { SubscriptionPlanDefinitionFilter } from "../domain/subscription-plan-definition.repository";
import type { PlatformBillingContext } from "./billing-context";

function toDTO(entity: SubscriptionPlanDefinitionEntity): SubscriptionPlanDefinitionDTO {
  return {
    id: entity.id,
    planCode: entity.planCode,
    name: entity.name,
    description: entity.description,
    monthlyPrice: entity.monthlyPrice,
    annualPrice: entity.annualPrice,
    currency: entity.currency,
    trialDays: entity.trialDays,
    isActive: entity.isActive,
  };
}

const planDefinitionRepository = new PrismaSubscriptionPlanDefinitionRepository();

// Public catalog tier — no tenantId, platform-ops actor only. Mirrors salary-component.service.ts's
// plain create/update/soft-delete shape, but every mutation here also writes a PlatformAuditLog
// row (per billing-audit.helpers.ts's own "every mutating billing service" discipline) — the
// repository itself takes no `tx`, so the write and its audit row are two sequential calls, not
// one atomic transaction (an audit-log write failing after a successful catalog edit is an
// accepted risk here, mirroring payroll-run.service.ts's own lockPayrollRun precedent).
export async function createSubscriptionPlanDefinition(
  input: unknown,
  context: PlatformBillingContext
): Promise<SubscriptionPlanDefinitionDTO> {
  const parsed = createSubscriptionPlanDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid subscription plan data.");
  }
  const data = parsed.data;
  const { actingUserId } = context;

  const existing = await planDefinitionRepository.findByPlanCode(data.planCode);
  if (existing) {
    throw new SubscriptionPlanDefinitionAlreadyExistsError();
  }

  try {
    const plan = await planDefinitionRepository.create({
      planCode: data.planCode,
      name: data.name,
      description: data.description ?? null,
      monthlyPrice: data.monthlyPrice,
      annualPrice: data.annualPrice,
      currency: data.currency,
      trialDays: data.trialDays,
      createdBy: actingUserId,
    });

    await recordPlatformAudit({
      actorId: actingUserId,
      action: "SUBSCRIPTION_PLAN_DEFINITION_CREATED",
      entityType: "SubscriptionPlanDefinition",
      entityId: plan.id,
      afterState: plan,
    });

    return toDTO(plan);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SubscriptionPlanDefinitionAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateSubscriptionPlanDefinition(
  id: string,
  input: unknown,
  context: PlatformBillingContext
): Promise<SubscriptionPlanDefinitionDTO> {
  const parsed = updateSubscriptionPlanDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid subscription plan data.");
  }
  const data = parsed.data;
  const { actingUserId } = context;

  const existing = await planDefinitionRepository.findById(id);
  if (!existing || existing.deletedAt !== null) {
    throw new SubscriptionPlanDefinitionNotFoundError();
  }

  const updated = await planDefinitionRepository.update(id, { ...data, updatedBy: actingUserId });

  await recordPlatformAudit({
    actorId: actingUserId,
    action: "SUBSCRIPTION_PLAN_DEFINITION_UPDATED",
    entityType: "SubscriptionPlanDefinition",
    entityId: updated.id,
    beforeState: existing,
    afterState: updated,
  });

  return toDTO(updated);
}

// Soft-delete/deactivate — mirrors BookRepository.softDelete's own shape. Deliberately named
// "deactivate" at this layer, not "delete": a plan definition is never physically removed once a
// Subscription has snapshotted it (see SubscriptionEntity's own comment).
export async function deactivateSubscriptionPlanDefinition(id: string, context: PlatformBillingContext): Promise<SubscriptionPlanDefinitionDTO> {
  const { actingUserId } = context;

  const existing = await planDefinitionRepository.findById(id);
  if (!existing || existing.deletedAt !== null) {
    throw new SubscriptionPlanDefinitionNotFoundError();
  }

  const deactivated = await planDefinitionRepository.softDelete(id, actingUserId);

  await recordPlatformAudit({
    actorId: actingUserId,
    action: "SUBSCRIPTION_PLAN_DEFINITION_DEACTIVATED",
    entityType: "SubscriptionPlanDefinition",
    entityId: deactivated.id,
    beforeState: existing,
    afterState: deactivated,
  });

  return toDTO(deactivated);
}

export async function getSubscriptionPlanDefinition(id: string): Promise<SubscriptionPlanDefinitionDTO | null> {
  const plan = await planDefinitionRepository.findById(id);
  return plan && plan.deletedAt === null ? toDTO(plan) : null;
}

export async function listSubscriptionPlanDefinitions(filter?: SubscriptionPlanDefinitionFilter): Promise<SubscriptionPlanDefinitionDTO[]> {
  const plans = await planDefinitionRepository.findAll(filter);
  return plans.map(toDTO);
}

export { toDTO as toSubscriptionPlanDefinitionDTO };
