import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionPlanDefinitionRepository } from "../infrastructure/prisma-subscription-plan-definition.repository";
import { PrismaSubscriptionRepository } from "../infrastructure/prisma-subscription.repository";
import {
  InvalidSubscriptionAssignmentError,
  SubscriptionAlreadyCancelledError,
  SubscriptionNotCancellableError,
  SubscriptionPlanDefinitionInactiveError,
  SubscriptionPlanDefinitionNotFoundError,
  TenantHasNoSubscriptionError,
} from "../domain/errors";
import { recordPlatformAudit } from "./billing-audit.helpers";
import { createSubscriptionSchema, cancelSubscriptionSchema, type SubscriptionDTO } from "./dto/subscription.dto";
import type { SubscriptionEntity } from "../domain/subscription.entity";
import type { BillingContext } from "./billing-context";

const MONTHS_PER_ANNUAL_CYCLE = 12;

function toDTO(entity: SubscriptionEntity): SubscriptionDTO {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    subscriptionPlanDefinitionId: entity.subscriptionPlanDefinitionId,
    plan: entity.plan,
    status: entity.status,
    billingCycle: entity.billingCycle,
    priceAtAssignment: entity.priceAtAssignment,
    currency: entity.currency,
    autoRenew: entity.autoRenew,
    trialEndsAt: entity.trialEndsAt ? entity.trialEndsAt.toISOString() : null,
    currentPeriodStart: entity.currentPeriodStart.toISOString().slice(0, 10),
    currentPeriodEnd: entity.currentPeriodEnd.toISOString().slice(0, 10),
    effectiveFrom: entity.effectiveFrom.toISOString().slice(0, 10),
    effectiveTo: entity.effectiveTo ? entity.effectiveTo.toISOString().slice(0, 10) : null,
    cancelledAt: entity.cancelledAt ? entity.cancelledAt.toISOString() : null,
    cancellationReason: entity.cancellationReason,
  };
}

// Adds `months` calendar months to `date`, mirroring how currentPeriodEnd is derived from
// currentPeriodStart for a MONTHLY cycle — plain calendar-month arithmetic (28-31 day months are
// all valid, no fixed 30-day assumption).
function addMonths(date: Date, months: number): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
  return result;
}

const planDefinitionRepository = new PrismaSubscriptionPlanDefinitionRepository();
const subscriptionRepository = new PrismaSubscriptionRepository();

// APPEND-ONLY revision: closes the current subscription (`effectiveTo` set to the new row's own
// `effectiveFrom`, so the two rows never overlap and never gap) and opens a new one, in one
// transaction — exactly mirrors assign-salary.service.ts's own "close then create" shape. Used
// both for a tenant's very first subscription (no current row to close) and for a plan/cycle
// change (current row closed, price/plan/cycle re-snapshotted on the new row).
export async function createSubscription(input: unknown, context: BillingContext): Promise<SubscriptionDTO> {
  const parsed = createSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid subscription data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const plan = await planDefinitionRepository.findById(data.subscriptionPlanDefinitionId);
  if (!plan || plan.deletedAt !== null) {
    throw new SubscriptionPlanDefinitionNotFoundError();
  }
  if (!plan.isActive) {
    throw new SubscriptionPlanDefinitionInactiveError();
  }

  const current = await subscriptionRepository.findCurrentForTenant(tenantId);
  if (current && current.effectiveFrom >= data.effectiveFrom) {
    throw new InvalidSubscriptionAssignmentError(
      "The new effective-from date must be after the current subscription's own effective-from date."
    );
  }

  const priceAtAssignment = data.billingCycle === "MONTHLY" ? plan.monthlyPrice : plan.annualPrice;
  const currentPeriodStart = data.effectiveFrom;
  const currentPeriodEnd = addMonths(data.effectiveFrom, data.billingCycle === "MONTHLY" ? 1 : MONTHS_PER_ANNUAL_CYCLE);
  const trialEndsAt = plan.trialDays > 0 ? addDays(data.effectiveFrom, plan.trialDays) : null;
  const status = trialEndsAt ? "TRIALING" : "ACTIVE";

  const subscription = await prisma.$transaction(async (tx) => {
    if (current) {
      await subscriptionRepository.close(tenantId, current.id, data.effectiveFrom, actingUserId, tx);
    }

    const created = await subscriptionRepository.create(
      {
        tenantId,
        subscriptionPlanDefinitionId: data.subscriptionPlanDefinitionId,
        plan: plan.planCode,
        status,
        billingCycle: data.billingCycle,
        priceAtAssignment,
        currency: plan.currency,
        autoRenew: data.autoRenew ?? true,
        trialEndsAt,
        currentPeriodStart,
        currentPeriodEnd,
        effectiveFrom: data.effectiveFrom,
        createdBy: actingUserId,
      },
      tx
    );

    await recordPlatformAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "SUBSCRIPTION_CREATED",
        entityType: "Subscription",
        entityId: created.id,
        beforeState: current,
        afterState: created,
      },
      tx
    );

    return created;
  });

  return toDTO(subscription);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Cancellation is a status flip IN PLACE on the current row, not a close-then-create — a
// cancellation is not automatically a plan change (see SubscriptionRepository.cancel's own
// comment), so `effectiveTo`/`effectiveFrom` are left untouched.
export async function cancelSubscription(input: unknown, context: BillingContext): Promise<SubscriptionDTO> {
  const parsed = cancelSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid cancellation request.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const current = await subscriptionRepository.findCurrentForTenant(tenantId);
  if (!current) {
    throw new TenantHasNoSubscriptionError();
  }
  if (current.status === "CANCELED") {
    throw new SubscriptionAlreadyCancelledError();
  }
  if (current.status === "EXPIRED") {
    throw new SubscriptionNotCancellableError();
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await subscriptionRepository.cancel(
      tenantId,
      current.id,
      { status: "CANCELED", cancelledBy: actingUserId, cancellationReason: data.reason },
      tx
    );

    await recordPlatformAudit(
      {
        tenantId,
        actorId: actingUserId,
        action: "SUBSCRIPTION_CANCELLED",
        entityType: "Subscription",
        entityId: updated.id,
        beforeState: current,
        afterState: updated,
      },
      tx
    );

    return updated;
  });

  return toDTO(cancelled);
}

export async function getCurrentSubscription(tenantId: string): Promise<SubscriptionDTO | null> {
  const current = await subscriptionRepository.findCurrentForTenant(tenantId);
  return current ? toDTO(current) : null;
}

// The full revision history for a tenant, newest first — mirrors
// assign-salary.service.ts's getSalaryAssignmentHistory (this IS the billing-cycle history
// requirement, no separate model needed — see SubscriptionEntity's own comment).
export async function getSubscriptionHistory(tenantId: string): Promise<SubscriptionDTO[]> {
  const history = await subscriptionRepository.findHistoryForTenant(tenantId);
  return history.map(toDTO);
}

export { toDTO as toSubscriptionDTO };
