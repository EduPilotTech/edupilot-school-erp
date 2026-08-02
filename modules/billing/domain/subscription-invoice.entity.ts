import type { SubscriptionPlanValue } from "./subscription-plan-definition.entity";

export type SubscriptionInvoiceStatusValue = "DRAFT" | "ISSUED" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "VOID";

// Tenant-owned — one per tenant per billing period, mirrors FeeInvoice/Payslip's own "per-period
// generated record" shape. Never hard/soft deleted — corrections go through `status` (VOID),
// mirroring FeeInvoice's own no-delete discipline.
export interface SubscriptionInvoiceEntity {
  id: string;
  tenantId: string;
  subscriptionId: string;
  // Nullable — the normal path is invoice-generated-by-a-run, but a manual/corrective invoice
  // shouldn't be forced to belong to a batch run it wasn't actually part of.
  billingRunId: string | null;
  invoiceNumber: string;
  billingPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  planAtInvoice: SubscriptionPlanValue;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: SubscriptionInvoiceStatusValue;
  issuedAt: Date | null;
  dueDate: Date;
  paidAt: Date | null;
  storageKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
