import "server-only";
import { prisma } from "@/lib/prisma";
import { PrismaSubscriptionRepository } from "../infrastructure/prisma-subscription.repository";
import { InvalidLifecycleTransitionError, SubscriptionNotFoundError } from "../domain/errors";
import { isValidLifecycleTransition } from "./subscription-lifecycle-transition.helpers";
import { recordPlatformAudit } from "./billing-audit.helpers";
import { toSubscriptionDTO } from "./subscription.service";
import type { SubscriptionDTO } from "./dto/subscription.dto";
import type { SubscriptionStatusValue } from "../domain/subscription.entity";
import type { BillingContext } from "./billing-context";

const subscriptionRepository = new PrismaSubscriptionRepository();

// The mutation layer behind the daily background jobs' TRIALING/ACTIVE/PAST_DUE/EXPIRED lifecycle
// transitions (see subscription-lifecycle-transition.helpers.ts's own ALLOWED_TRANSITIONS table
// for the full rules). Loads via `findById` (not `findCurrentForTenant`) because a caller may
// target a specific row by id, but only that tenant's CURRENT row (`effectiveTo === null`) is
// actually allowed to transition — see SubscriptionRepository.updateLifecycleStatus's own
// "generalized sibling of cancel()" comment for why this is a pure status-flip-in-place, never a
// close-then-create.
export async function transitionSubscriptionStatus(
  tenantId: string,
  subscriptionId: string,
  targetStatus: SubscriptionStatusValue,
  context: BillingContext
): Promise<SubscriptionDTO> {
  const current = await subscriptionRepository.findById(tenantId, subscriptionId);
  if (!current) {
    throw new SubscriptionNotFoundError();
  }
  if (current.effectiveTo !== null) {
    throw new InvalidLifecycleTransitionError("Only a tenant's current subscription can undergo a lifecycle transition.");
  }
  if (!isValidLifecycleTransition(current.status, targetStatus)) {
    throw new InvalidLifecycleTransitionError(`Cannot transition a subscription from ${current.status} to ${targetStatus}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await subscriptionRepository.updateLifecycleStatus(
      tenantId,
      subscriptionId,
      { status: targetStatus, updatedBy: context.actingUserId },
      tx
    );

    // Direct plain-client write, not withTenantContext — same precedent subscription.service.ts's
    // createSubscription uses for keeping Tenant.subscriptionStatus in sync with the tenant's
    // current Subscription row (Tenant has no tenant_id column to scope by in the first place;
    // see withTenantContext's own comment).
    await tx.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: targetStatus, updatedBy: context.actingUserId },
    });

    await recordPlatformAudit(
      {
        tenantId,
        actorId: context.actingUserId,
        action: "SUBSCRIPTION_LIFECYCLE_TRANSITIONED",
        entityType: "Subscription",
        entityId: subscriptionId,
        beforeState: current,
        afterState: result,
      },
      tx
    );

    return result;
  });

  return toSubscriptionDTO(updated);
}

// PAST_DUE — a payment failed but access continues during the grace period (see
// evaluateLicenseValidity's own documented PAST_DUE/"Grace Period" semantics).
export async function moveToGracePeriod(tenantId: string, subscriptionId: string, context: BillingContext): Promise<SubscriptionDTO> {
  return transitionSubscriptionStatus(tenantId, subscriptionId, "PAST_DUE", context);
}

// EXPIRED — the grace period was exhausted with no successful payment, or a trial that was never
// converted before `trialEndsAt`.
export async function moveToExpired(tenantId: string, subscriptionId: string, context: BillingContext): Promise<SubscriptionDTO> {
  return transitionSubscriptionStatus(tenantId, subscriptionId, "EXPIRED", context);
}

// ACTIVE — a PAST_DUE subscription recovering after a late payment succeeds. Distinct from the
// TRIALING -> ACTIVE trial-conversion transition, which also routes through this same target
// status but a different originating state.
export async function moveToActive(tenantId: string, subscriptionId: string, context: BillingContext): Promise<SubscriptionDTO> {
  return transitionSubscriptionStatus(tenantId, subscriptionId, "ACTIVE", context);
}
