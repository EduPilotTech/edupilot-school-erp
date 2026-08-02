import { z } from "zod";
import type { SubscriptionInvoiceStatusValue } from "../../domain/subscription-invoice.entity";
import type { SubscriptionPlanValue } from "../../domain/subscription-plan-definition.entity";

export const listSubscriptionInvoicesSchema = z.object({
  subscriptionId: z.string().uuid("Subscription is required."),
});
export type ListSubscriptionInvoicesServiceInput = z.infer<typeof listSubscriptionInvoicesSchema>;

export interface SubscriptionInvoiceDTO {
  id: string;
  tenantId: string;
  subscriptionId: string;
  billingRunId: string | null;
  invoiceNumber: string;
  billingPeriod: string;
  periodStart: string;
  periodEnd: string;
  planAtInvoice: SubscriptionPlanValue;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: SubscriptionInvoiceStatusValue;
  issuedAt: string | null;
  dueDate: string;
  paidAt: string | null;
}
