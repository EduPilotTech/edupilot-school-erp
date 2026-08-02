import type { Prisma } from "@/lib/generated/prisma/client";
import type { SubscriptionPlanValue } from "./subscription-plan-definition.entity";
import type { BillingCycleValue, SubscriptionEntity, SubscriptionStatusValue } from "./subscription.entity";

export interface CreateSubscriptionInput {
  tenantId: string;
  subscriptionPlanDefinitionId: string;
  plan: SubscriptionPlanValue;
  status?: SubscriptionStatusValue;
  billingCycle: BillingCycleValue;
  priceAtAssignment: number;
  currency: string;
  autoRenew?: boolean;
  trialEndsAt?: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  effectiveFrom: Date;
  gatewaySubscriptionId?: string | null;
  createdBy?: string | null;
}

export interface CancelSubscriptionInput {
  status: SubscriptionStatusValue;
  cancelledBy: string | null;
  cancellationReason: string;
}

// Bundle D, Step 0 — additive. `status` is constrained to non-terminal-entry values by the
// SERVICE layer (subscription-lifecycle-transition.helpers.ts's ALLOWED_TRANSITIONS), not by this
// repository — this input type is deliberately as permissive as CancelSubscriptionInput's own
// `status` field.
export interface UpdateSubscriptionLifecycleStatusInput {
  status: SubscriptionStatusValue;
  updatedBy: string | null;
}

// Deliberately exposes only `create`, `close`, and `cancel` — no generic `update` — mirroring
// EmployeeSalaryAssignmentRepository's own "never overwrite historical data" discipline exactly.
export interface SubscriptionRepository {
  // The row with `effectiveTo IS NULL` for this tenant, if any — "current" is derived this way.
  findCurrentForTenant(tenantId: string): Promise<SubscriptionEntity | null>;

  findHistoryForTenant(tenantId: string): Promise<SubscriptionEntity[]>;

  findById(tenantId: string, id: string): Promise<SubscriptionEntity | null>;

  create(input: CreateSubscriptionInput, tx?: Prisma.TransactionClient): Promise<SubscriptionEntity>;

  // The one allowed "close" mutation: sets `effectiveTo` on an existing row, closing it. Never
  // touches `plan`/`priceAtAssignment`/`billingCycle`.
  close(
    tenantId: string,
    id: string,
    effectiveTo: Date,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<SubscriptionEntity>;

  // The one allowed "cancel" mutation: a status flip IN PLACE on the current row — a cancellation
  // is a status change, not automatically a plan change, so it does not close the row (see
  // subscription.service.ts's own reasoning). Sets `cancelledAt`/`cancelledBy`/`cancellationReason`
  // and `status` together.
  cancel(
    tenantId: string,
    id: string,
    input: CancelSubscriptionInput,
    tx?: Prisma.TransactionClient
  ): Promise<SubscriptionEntity>;

  // Bundle D, Step 0 — the generalized sibling of the already-existing `cancel()` above: a pure
  // status-flip-in-place on the CURRENT row (never touches plan/price/billingCycle/effectiveFrom/
  // effectiveTo), for the TRIALING/ACTIVE/PAST_DUE/EXPIRED lifecycle transitions the daily
  // background jobs drive. Mirrors `cancel()`'s own "this is a status change, not a plan change,
  // so the row is never closed" reasoning, generalized beyond just the CANCELED transition.
  updateLifecycleStatus(
    tenantId: string,
    id: string,
    input: UpdateSubscriptionLifecycleStatusInput,
    tx?: Prisma.TransactionClient
  ): Promise<SubscriptionEntity>;
}
