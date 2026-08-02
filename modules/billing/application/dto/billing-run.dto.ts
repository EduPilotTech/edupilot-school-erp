import { z } from "zod";
import type { BillingRunStatusValue } from "../../domain/billing-run.entity";

export const createBillingRunSchema = z.object({
  billingPeriod: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing period must be in YYYY-MM format."),
});
export type CreateBillingRunServiceInput = z.infer<typeof createBillingRunSchema>;

export interface BillingRunDTO {
  id: string;
  billingPeriod: string;
  status: BillingRunStatusValue;
  processedAt: string | null;
  lockedAt: string | null;
  totalInvoicesGenerated: number;
  totalAmountBilled: number;
}

export interface ProcessBillingRunResultDTO {
  billingRun: BillingRunDTO;
  invoicesGenerated: number;
  skippedTenantIds: string[];
}
