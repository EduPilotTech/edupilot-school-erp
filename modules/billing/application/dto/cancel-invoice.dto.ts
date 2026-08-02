import { z } from "zod";

// Mirrors cancelSubscriptionSchema's exact shape/message style (see dto/subscription.dto.ts) —
// same "non-empty, trimmed, max 500" reason requirement, just for a SubscriptionInvoice instead
// of a Subscription.
export const cancelInvoiceSchema = z.object({
  reason: z.string().trim().min(1, "A cancellation reason is required.").max(500),
});
export type CancelInvoiceServiceInput = z.infer<typeof cancelInvoiceSchema>;
