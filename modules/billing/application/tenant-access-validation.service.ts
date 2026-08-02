import "server-only";
import { prisma } from "@/lib/prisma";
import { LicenseInvalidError, SchoolSuspendedError } from "../domain/errors";
import { validateLicense } from "./license-validation.service";
import type { TenantAccessResultDTO } from "./dto/tenant-access.dto";

// The composed "is this tenant allowed into the application at all" check — License Validation
// (Bundle A's validateLicense) composed with School Suspension. `Tenant.status`/`TenantStatus
// .SUSPENDED` is a DIFFERENT, orthogonal field from the subscription lifecycle status
// (`Tenant.subscriptionStatus`) — a tenant can be SUSPENDED (e.g. for a ToS violation unrelated to
// billing) while its subscription is still nominally ACTIVE, so suspension is checked as an
// absolute override, independent of subscription state.
//
// Mirrors getCurrentTenant's own `prisma.tenant.findUniqueOrThrow` idiom (lib/auth/auth-context
// .ts) — Tenant has no tenant_id column to scope by in the first place, so this deliberately does
// not go through withTenantContext.
export async function validateTenantAccess(tenantId: string): Promise<TenantAccessResultDTO> {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  // Always resolved, even when the tenant turns out to be suspended below — the suspended
  // response still needs to report what the subscription check would have said, for visibility.
  const licenseResult = await validateLicense({ tenantId });

  if (tenant.status === "SUSPENDED") {
    return {
      valid: false,
      reason: "This school's account has been suspended. Contact support to reactivate.",
      subscriptionStatus: licenseResult.status,
      schoolSuspended: true,
    };
  }

  return {
    valid: licenseResult.valid,
    reason: licenseResult.reason,
    subscriptionStatus: licenseResult.status,
    schoolSuspended: false,
  };
}

// The throwing counterpart — used by other modules/Server Actions to hard-gate access. Suspension
// is checked first (an absolute override, per validateTenantAccess's own comment); a plain invalid
// license (not suspended) throws the already-existing LicenseInvalidError with the resolved reason.
export async function requireTenantAccess(tenantId: string): Promise<void> {
  const access = await validateTenantAccess(tenantId);
  if (access.schoolSuspended) {
    throw new SchoolSuspendedError();
  }
  if (!access.valid) {
    throw new LicenseInvalidError(access.reason ?? undefined);
  }
}
