import "server-only";
import { resolveEntitlement, requireFeatureEntitlement } from "./feature-entitlement.service";
import { validateTenantAccess } from "./tenant-access-validation.service";
import { LicenseInvalidError, SchoolSuspendedError } from "../domain/errors";
import type { FeatureLockResultDTO } from "./dto/feature-lock.dto";

// resolveEntitlement (Bundle A, feature-entitlement.service.ts) requires a full BillingContext
// {tenantId, actingUserId} even though its own logic never reads actingUserId — only tenantId
// drives the subscription/entitlement lookup. This sentinel mirrors payment-processing.service
// .ts's own WEBHOOK_SYSTEM_ACTOR convention for a system-initiated call with no real acting user.
const SYSTEM_ACTOR = "system:feature-lock";

// Composes Step 3's tenant-access validation (license + school-suspension) with Bundle A's
// feature entitlement resolution. An invalid/suspended tenant has every feature locked, full
// stop, regardless of what their plan would otherwise entitle them to — entitlement is never even
// resolved in that case.
export async function resolveFeatureLock(tenantId: string, featureKey: string): Promise<FeatureLockResultDTO> {
  const access = await validateTenantAccess(tenantId);
  if (!access.valid) {
    return { locked: true, reason: access.reason, allowed: false, limit: null };
  }

  const entitlement = await resolveEntitlement({ featureKey }, { tenantId, actingUserId: SYSTEM_ACTOR });
  return { locked: !entitlement.allowed, reason: null, allowed: entitlement.allowed, limit: entitlement.limit };
}

// The throwing counterpart — distinguishes the three possible causes of a lock so a caller can
// show a specific message: SchoolSuspendedError (absolute override), LicenseInvalidError (no
// valid subscription), or FeatureNotEntitledError (valid tenant, plan just doesn't include this
// feature — thrown by the reused requireFeatureEntitlement). Re-derives tenant access directly
// (rather than through resolveFeatureLock's collapsed DTO) so the suspended/invalid-license
// distinction survives.
export async function requireFeatureUnlocked(tenantId: string, featureKey: string): Promise<void> {
  const access = await validateTenantAccess(tenantId);
  if (access.schoolSuspended) {
    throw new SchoolSuspendedError();
  }
  if (!access.valid) {
    throw new LicenseInvalidError(access.reason ?? undefined);
  }

  await requireFeatureEntitlement(tenantId, featureKey);
}
