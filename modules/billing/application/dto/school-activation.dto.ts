import { z } from "zod";

// Mirrors cancelSubscriptionSchema's/cancelInvoiceSchema's exact shape — a required, non-empty
// reason, no other fields (tenantId comes from the service's own first argument, not this input).
export const suspendSchoolSchema = z.object({
  reason: z.string().trim().min(1, "A suspension reason is required.").max(500),
});
export type SuspendSchoolServiceInput = z.infer<typeof suspendSchoolSchema>;
