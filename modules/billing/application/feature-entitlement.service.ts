import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionRepository } from "../infrastructure/prisma-subscription.repository";
import { PrismaPlanFeatureEntitlementRepository } from "../infrastructure/prisma-plan-feature-entitlement.repository";
import { FeatureNotEntitledError } from "../domain/errors";
import { resolveFeatureEntitlement } from "./feature-entitlement-resolution.helpers";
import { resolveEntitlementSchema, type EntitlementResolutionDTO } from "./dto/entitlement-resolution.dto";
import type { BillingContext } from "./billing-context";

const subscriptionRepository = new PrismaSubscriptionRepository();
const entitlementRepository = new PrismaPlanFeatureEntitlementRepository();

// Gates individual features once a tenant is already let into the application (distinct from
// license-validation.service.ts's coarse "let in at all" check). `tenantId` comes from
// BillingContext, not the parsed input, mirroring every other tenant-scoped service's own
// "tenantId from context" convention. A tenant with no current subscription at all is
// deny-by-default here too — the same "no row -> not entitled" philosophy
// resolveFeatureEntitlement already applies to a missing PlanFeatureEntitlement row.
export async function resolveEntitlement(input: unknown, context: BillingContext): Promise<EntitlementResolutionDTO> {
  const parsed = resolveEntitlementSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid entitlement resolution request.");
  }
  const { featureKey } = parsed.data;
  const { tenantId } = context;

  const subscription = await subscriptionRepository.findCurrentForTenant(tenantId);
  if (!subscription) {
    return { featureKey, allowed: false, limit: null };
  }

  const entitlement = await entitlementRepository.findByPlanDefinitionAndKey(subscription.subscriptionPlanDefinitionId, featureKey);
  const resolved = resolveFeatureEntitlement(entitlement);

  return { featureKey, allowed: resolved.allowed, limit: resolved.limit };
}

// The throwing counterpart of resolveEntitlement — used by other modules to hard-gate a
// premium/limited feature rather than merely display its resolved state.
export async function requireFeatureEntitlement(tenantId: string, featureKey: string): Promise<void> {
  const subscription = await subscriptionRepository.findCurrentForTenant(tenantId);
  const entitlement = subscription
    ? await entitlementRepository.findByPlanDefinitionAndKey(subscription.subscriptionPlanDefinitionId, featureKey)
    : null;
  const resolved = resolveFeatureEntitlement(entitlement);

  if (!resolved.allowed) {
    throw new FeatureNotEntitledError();
  }
}
