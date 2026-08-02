import type { Prisma } from "@/lib/generated/prisma/client";
import type { SubscriptionPlanValue } from "./subscription-plan-definition.entity";
import type { SubscriptionInvoiceEntity, SubscriptionInvoiceStatusValue } from "./subscription-invoice.entity";

export interface CreateSubscriptionInvoiceInput {
  tenantId: string;
  subscriptionId: string;
  billingRunId?: string | null;
  invoiceNumber: string;
  billingPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  planAtInvoice: SubscriptionPlanValue;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
  status?: SubscriptionInvoiceStatusValue;
  issuedAt?: Date | null;
  dueDate: Date;
  storageKey?: string | null;
  createdBy?: string | null;
}

export interface UpdateSubscriptionInvoiceStatusInput {
  status: SubscriptionInvoiceStatusValue;
  issuedAt?: Date | null;
  paidAt?: Date | null;
  updatedBy: string | null;
}

// `create` requires an already-open `tx` — a SubscriptionInvoice must never be written outside
// the transaction that also allocates its `invoiceNumber` from PlatformInvoiceSequence, mirroring
// FeeInvoiceRepository/FeePaymentRepository's own "join the caller's transaction" discipline.
export interface SubscriptionInvoiceRepository {
  findById(tenantId: string, id: string): Promise<SubscriptionInvoiceEntity | null>;
  findByInvoiceNumber(tenantId: string, invoiceNumber: string): Promise<SubscriptionInvoiceEntity | null>;
  findBySubscription(tenantId: string, subscriptionId: string): Promise<SubscriptionInvoiceEntity[]>;

  // Bundle C, Step 0 — additive. `findBySubscription` only scopes to one subscription;
  // Invoice History / Outstanding / Paid Invoice reads need the tenant-wide view across every
  // subscription the tenant has ever had. Same "newest first" ordering convention as
  // `findBySubscription` (periodStart desc).
  findByTenant(tenantId: string): Promise<SubscriptionInvoiceEntity[]>;

  create(input: CreateSubscriptionInvoiceInput, tx: Prisma.TransactionClient): Promise<SubscriptionInvoiceEntity>;

  updateStatus(
    tenantId: string,
    id: string,
    input: UpdateSubscriptionInvoiceStatusInput,
    tx?: Prisma.TransactionClient
  ): Promise<SubscriptionInvoiceEntity>;

  // Bundle C, Step 5 (invoice-pdf.service.ts) — additive. `updateStatus` only ever touches
  // status/issuedAt/paidAt; persisting the generated PDF's storage key needed its own narrow
  // method rather than overloading `updateStatus` with an unrelated field.
  updateStorageKey(tenantId: string, id: string, storageKey: string, tx?: Prisma.TransactionClient): Promise<SubscriptionInvoiceEntity>;
}
