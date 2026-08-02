import type { SubscriptionStatusValue } from "../../domain/subscription.entity";

// `subscriptionStatus` mirrors LicenseValidationResultDTO's own status union — the license check
// underneath tenant-access-validation.service.ts is always run (even when the tenant is
// suspended, "for visibility"), so this field is always populated.
export interface TenantAccessResultDTO {
  valid: boolean;
  reason: string | null;
  subscriptionStatus: SubscriptionStatusValue | "NO_SUBSCRIPTION";
  schoolSuspended: boolean;
}
