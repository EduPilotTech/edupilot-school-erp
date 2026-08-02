import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Subscription as PrismaSubscription } from "@/lib/generated/prisma/client";
import type {
  CancelSubscriptionInput,
  CreateSubscriptionInput,
  SubscriptionRepository,
  UpdateSubscriptionLifecycleStatusInput,
} from "../domain/subscription.repository";
import type { BillingCycleValue, SubscriptionEntity, SubscriptionStatusValue } from "../domain/subscription.entity";
import type { SubscriptionPlanValue } from "../domain/subscription-plan-definition.entity";

// Tenant-owned, append-only (close-then-create) — mirrors
// prisma-employee-salary-assignment.repository.ts's exact shape.
export function toEntity(row: PrismaSubscription): SubscriptionEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    subscriptionPlanDefinitionId: row.subscriptionPlanDefinitionId,
    plan: row.plan as SubscriptionPlanValue,
    status: row.status as SubscriptionStatusValue,
    billingCycle: row.billingCycle as BillingCycleValue,
    priceAtAssignment: row.priceAtAssignment.toNumber(),
    currency: row.currency,
    autoRenew: row.autoRenew,
    trialEndsAt: row.trialEndsAt,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    gatewaySubscriptionId: row.gatewaySubscriptionId,
    cancelledAt: row.cancelledAt,
    cancelledBy: row.cancelledBy,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  async findCurrentForTenant(tenantId: string): Promise<SubscriptionEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.subscription.findFirst({ where: { tenantId, effectiveTo: null } })
    );
    return row ? toEntity(row) : null;
  }

  async findHistoryForTenant(tenantId: string): Promise<SubscriptionEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.subscription.findMany({ where: { tenantId }, orderBy: { effectiveFrom: "desc" } })
    );
    return rows.map(toEntity);
  }

  async findById(tenantId: string, id: string): Promise<SubscriptionEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.subscription.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async create(input: CreateSubscriptionInput, tx?: Prisma.TransactionClient): Promise<SubscriptionEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.subscription.create({
          data: {
            tenantId: input.tenantId,
            subscriptionPlanDefinitionId: input.subscriptionPlanDefinitionId,
            plan: input.plan,
            status: input.status ?? "TRIALING",
            billingCycle: input.billingCycle,
            priceAtAssignment: input.priceAtAssignment,
            currency: input.currency,
            autoRenew: input.autoRenew ?? true,
            trialEndsAt: input.trialEndsAt ?? null,
            currentPeriodStart: input.currentPeriodStart,
            currentPeriodEnd: input.currentPeriodEnd,
            effectiveFrom: input.effectiveFrom,
            gatewaySubscriptionId: input.gatewaySubscriptionId ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async close(
    tenantId: string,
    id: string,
    effectiveTo: Date,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<SubscriptionEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.subscription.update({
          where: { tenantId_id: { tenantId, id } },
          data: { effectiveTo, updatedBy },
        }),
      tx
    );
    return toEntity(row);
  }

  async cancel(
    tenantId: string,
    id: string,
    input: CancelSubscriptionInput,
    tx?: Prisma.TransactionClient
  ): Promise<SubscriptionEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.subscription.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: input.status,
            cancelledAt: new Date(),
            cancelledBy: input.cancelledBy,
            cancellationReason: input.cancellationReason,
            updatedBy: input.cancelledBy,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  // Bundle D, Step 0 — additive. Mirrors `cancel()`'s own shape/tx-handling precisely: it writes
  // ONLY `status` and `updatedBy` (`updatedAt` is handled by Prisma's `@updatedAt`), never
  // plan/price/billingCycle/effectiveFrom/effectiveTo.
  async updateLifecycleStatus(
    tenantId: string,
    id: string,
    input: UpdateSubscriptionLifecycleStatusInput,
    tx?: Prisma.TransactionClient
  ): Promise<SubscriptionEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.subscription.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: input.status,
            updatedBy: input.updatedBy,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
