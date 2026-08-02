import { z } from "zod";
import type { SubscriptionStatusValue } from "../../domain/subscription.entity";

export const validateLicenseSchema = z.object({
  tenantId: z.string().uuid("Tenant is required."),
});
export type ValidateLicenseServiceInput = z.infer<typeof validateLicenseSchema>;

export interface LicenseValidationResultDTO {
  valid: boolean;
  status: SubscriptionStatusValue | "NO_SUBSCRIPTION";
  reason: string | null;
}
