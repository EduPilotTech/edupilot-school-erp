// Pure, no "server-only" import — deliberately unit-testable in isolation.
import type { PlanFeatureEntitlementEntity } from "../domain/plan-feature-entitlement.entity";

export interface ResolvedEntitlement {
  allowed: boolean;
  limit: number | null;
}

// Branching resolution rule, deny-by-default: no entitlement row for this feature key on the
// tenant's current plan means the plan simply doesn't include the feature at all -> denied. A
// BOOLEAN entitlement's `allowed` is its stored booleanValue (null/false both mean "off"). A
// LIMIT entitlement is "allowed" only if its limit is greater than zero — a LIMIT row with
// limitValue 0 is a deliberate "included in the catalog but not granted" row, not an error.
export function resolveFeatureEntitlement(entitlement: PlanFeatureEntitlementEntity | null): ResolvedEntitlement {
  if (!entitlement) {
    return { allowed: false, limit: null };
  }
  if (entitlement.valueType === "BOOLEAN") {
    return { allowed: entitlement.booleanValue === true, limit: null };
  }
  const limit = entitlement.limitValue ?? 0;
  return { allowed: limit > 0, limit };
}
