import "server-only";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlanDefinition as PrismaSubscriptionPlanDefinition } from "@/lib/generated/prisma/client";
import type {
  CreateSubscriptionPlanDefinitionInput,
  SubscriptionPlanDefinitionFilter,
  SubscriptionPlanDefinitionRepository,
  UpdateSubscriptionPlanDefinitionInput,
} from "../domain/subscription-plan-definition.repository";
import type { SubscriptionPlanDefinitionEntity, SubscriptionPlanValue } from "../domain/subscription-plan-definition.entity";

// Public catalog tier — direct `prisma` client, no `withTenantContext` (mirrors
// lib/auth/auth-context.ts's own "Tenant lookup by its own id" precedent: this table has no
// tenantId column to scope by in the first place, so there is no RLS tenant context to set).
export function toEntity(row: PrismaSubscriptionPlanDefinition): SubscriptionPlanDefinitionEntity {
  return {
    id: row.id,
    planCode: row.planCode as SubscriptionPlanValue,
    name: row.name,
    description: row.description,
    monthlyPrice: row.monthlyPrice.toNumber(),
    annualPrice: row.annualPrice.toNumber(),
    currency: row.currency,
    trialDays: row.trialDays,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaSubscriptionPlanDefinitionRepository implements SubscriptionPlanDefinitionRepository {
  async findById(id: string): Promise<SubscriptionPlanDefinitionEntity | null> {
    const row = await prisma.subscriptionPlanDefinition.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByPlanCode(planCode: SubscriptionPlanValue): Promise<SubscriptionPlanDefinitionEntity | null> {
    const row = await prisma.subscriptionPlanDefinition.findUnique({ where: { planCode } });
    return row ? toEntity(row) : null;
  }

  async findAll(filter?: SubscriptionPlanDefinitionFilter): Promise<SubscriptionPlanDefinitionEntity[]> {
    const rows = await prisma.subscriptionPlanDefinition.findMany({
      where: {
        deletedAt: null,
        ...(filter?.isActive !== undefined ? { isActive: filter.isActive } : {}),
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toEntity);
  }

  async create(input: CreateSubscriptionPlanDefinitionInput): Promise<SubscriptionPlanDefinitionEntity> {
    const row = await prisma.subscriptionPlanDefinition.create({
      data: {
        planCode: input.planCode,
        name: input.name,
        description: input.description ?? null,
        monthlyPrice: input.monthlyPrice,
        annualPrice: input.annualPrice,
        currency: input.currency ?? "INR",
        trialDays: input.trialDays ?? 0,
        createdBy: input.createdBy ?? null,
        updatedBy: input.createdBy ?? null,
      },
    });
    return toEntity(row);
  }

  async update(id: string, input: UpdateSubscriptionPlanDefinitionInput): Promise<SubscriptionPlanDefinitionEntity> {
    const row = await prisma.subscriptionPlanDefinition.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        monthlyPrice: input.monthlyPrice,
        annualPrice: input.annualPrice,
        currency: input.currency,
        trialDays: input.trialDays,
        isActive: input.isActive,
        updatedBy: input.updatedBy,
      },
    });
    return toEntity(row);
  }

  async softDelete(id: string, deletedBy: string | null): Promise<SubscriptionPlanDefinitionEntity> {
    const row = await prisma.subscriptionPlanDefinition.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
    });
    return toEntity(row);
  }
}
