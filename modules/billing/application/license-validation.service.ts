import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaSubscriptionRepository } from "../infrastructure/prisma-subscription.repository";
import { LicenseInvalidError } from "../domain/errors";
import { evaluateLicenseValidity } from "./license-validation.helpers";
import { validateLicenseSchema, type LicenseValidationResultDTO } from "./dto/license-validation.dto";

const subscriptionRepository = new PrismaSubscriptionRepository();

// The coarse "is this tenant allowed into the application at all" check — a non-throwing read for
// UI/status-banner use (see evaluateLicenseValidity's own comment for the exact validity rules
// per SubscriptionStatusValue). `tenantId` comes from the parsed input, not from a BillingContext:
// this check can run before a tenant-scoped session is fully established (e.g. at proxy-level
// routing — see docs/SECURITY_GUIDELINES.md's own "never trust proxy.ts as the sole authorization
// boundary" rule, which is exactly why requireValidLicense below exists as a second, throwing
// gate any Server Action can call independently).
export async function validateLicense(input: unknown): Promise<LicenseValidationResultDTO> {
  const parsed = validateLicenseSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid license validation request.");
  }

  const subscription = await subscriptionRepository.findCurrentForTenant(parsed.data.tenantId);
  return evaluateLicenseValidity(subscription, new Date());
}

// The throwing counterpart of validateLicense — used by other modules/Server Actions to hard-gate
// access rather than merely display a status. Never trusts a cached/previous validity result;
// always re-resolves the tenant's current subscription.
export async function requireValidLicense(tenantId: string): Promise<void> {
  const subscription = await subscriptionRepository.findCurrentForTenant(tenantId);
  const result = evaluateLicenseValidity(subscription, new Date());
  if (!result.valid) {
    throw new LicenseInvalidError(result.reason ?? undefined);
  }
}
