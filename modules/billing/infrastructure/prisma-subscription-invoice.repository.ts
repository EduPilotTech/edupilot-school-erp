import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, SubscriptionInvoice as PrismaSubscriptionInvoice } from "@/lib/generated/prisma/client";
import type {
  CreateSubscriptionInvoiceInput,
  SubscriptionInvoiceRepository,
  UpdateSubscriptionInvoiceStatusInput,
} from "../domain/subscription-invoice.repository";
import type { SubscriptionInvoiceEntity, SubscriptionInvoiceStatusValue } from "../domain/subscription-invoice.entity";
import type { SubscriptionPlanValue } from "../domain/subscription-plan-definition.entity";

// Tenant-owned, never hard/soft deleted — corrections go through `status` (VOID) only.
export function toEntity(row: PrismaSubscriptionInvoice): SubscriptionInvoiceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    subscriptionId: row.subscriptionId,
    billingRunId: row.billingRunId,
    invoiceNumber: row.invoiceNumber,
    billingPeriod: row.billingPeriod,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    planAtInvoice: row.planAtInvoice as SubscriptionPlanValue,
    amount: row.amount.toNumber(),
    taxAmount: row.taxAmount.toNumber(),
    totalAmount: row.totalAmount.toNumber(),
    currency: row.currency,
    status: row.status as SubscriptionInvoiceStatusValue,
    issuedAt: row.issuedAt,
    dueDate: row.dueDate,
    paidAt: row.paidAt,
    storageKey: row.storageKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaSubscriptionInvoiceRepository implements SubscriptionInvoiceRepository {
  async findById(tenantId: string, id: string): Promise<SubscriptionInvoiceEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.subscriptionInvoice.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByInvoiceNumber(tenantId: string, invoiceNumber: string): Promise<SubscriptionInvoiceEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.subscriptionInvoice.findUnique({ where: { tenantId_invoiceNumber: { tenantId, invoiceNumber } } })
    );
    return row ? toEntity(row) : null;
  }

  async findBySubscription(tenantId: string, subscriptionId: string): Promise<SubscriptionInvoiceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.subscriptionInvoice.findMany({
        where: { tenantId, subscriptionId },
        orderBy: { periodStart: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  // Bundle C, Step 0 — additive. Same tenant-scoping (`withTenantContext`) and "newest first"
  // ordering convention (periodStart desc) as `findBySubscription` above, just without the
  // `subscriptionId` filter.
  async findByTenant(tenantId: string): Promise<SubscriptionInvoiceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.subscriptionInvoice.findMany({
        where: { tenantId },
        orderBy: { periodStart: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateSubscriptionInvoiceInput, tx: Prisma.TransactionClient): Promise<SubscriptionInvoiceEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.subscriptionInvoice.create({
          data: {
            tenantId: input.tenantId,
            subscriptionId: input.subscriptionId,
            billingRunId: input.billingRunId ?? null,
            invoiceNumber: input.invoiceNumber,
            billingPeriod: input.billingPeriod,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            planAtInvoice: input.planAtInvoice,
            amount: input.amount,
            taxAmount: input.taxAmount ?? 0,
            totalAmount: input.totalAmount,
            currency: input.currency,
            status: input.status ?? "DRAFT",
            issuedAt: input.issuedAt ?? null,
            dueDate: input.dueDate,
            storageKey: input.storageKey ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    input: UpdateSubscriptionInvoiceStatusInput,
    tx?: Prisma.TransactionClient
  ): Promise<SubscriptionInvoiceEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.subscriptionInvoice.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: input.status,
            issuedAt: input.issuedAt,
            paidAt: input.paidAt,
            updatedBy: input.updatedBy,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  // Bundle C, Step 5 (invoice-pdf.service.ts) — additive. A narrow, single-field update:
  // `updateStatus` deliberately does not touch `storageKey` (status/issuedAt/paidAt are a
  // different concern from "where the rendered PDF landed in Storage"), so this is its own
  // method rather than an extra optional field bolted onto `UpdateSubscriptionInvoiceStatusInput`.
  async updateStorageKey(tenantId: string, id: string, storageKey: string, tx?: Prisma.TransactionClient): Promise<SubscriptionInvoiceEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.subscriptionInvoice.update({
          where: { tenantId_id: { tenantId, id } },
          data: { storageKey },
        }),
      tx
    );
    return toEntity(row);
  }
}
