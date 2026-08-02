import "server-only";
import { prisma } from "@/lib/prisma";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Payment as PrismaPayment } from "@/lib/generated/prisma/client";
import type {
  CreatePaymentInput,
  PaymentRepository,
  RecordPaymentRefundInput,
  UpdatePaymentStatusInput,
} from "../domain/payment.repository";
import type { PaymentEntity, PaymentGatewayProviderCodeValue, PaymentStatusValue } from "../domain/payment.entity";

// Tenant-owned, immutable-once-settled — mirrors prisma-fee-payment.repository.ts's own
// "corrections via status-flip only" discipline. Never stores card/instrument data.
export function toEntity(row: PrismaPayment): PaymentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    subscriptionInvoiceId: row.subscriptionInvoiceId,
    gatewayProvider: row.gatewayProvider as PaymentGatewayProviderCodeValue,
    gatewayOrderId: row.gatewayOrderId,
    gatewayPaymentId: row.gatewayPaymentId,
    amount: row.amount.toNumber(),
    currency: row.currency,
    status: row.status as PaymentStatusValue,
    method: row.method,
    gatewayResponseSnapshot: row.gatewayResponseSnapshot,
    failureReason: row.failureReason,
    refundedAmount: row.refundedAmount.toNumber(),
    capturedAt: row.capturedAt,
    refundedAt: row.refundedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaPaymentRepository implements PaymentRepository {
  async findById(tenantId: string, id: string): Promise<PaymentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.payment.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findByInvoice(tenantId: string, subscriptionInvoiceId: string): Promise<PaymentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.payment.findMany({ where: { tenantId, subscriptionInvoiceId }, orderBy: { createdAt: "desc" } })
    );
    return rows.map(toEntity);
  }

  // Bundle C, Step 0 — additive. Same tenant-scoping (`withTenantContext`) and "newest first"
  // ordering convention (createdAt desc) as `findByInvoice` above, just without the
  // `subscriptionInvoiceId` filter.
  async findByTenant(tenantId: string): Promise<PaymentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.payment.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
    );
    return rows.map(toEntity);
  }

  async findByGatewayOrderId(
    tenantId: string,
    gatewayProvider: PaymentGatewayProviderCodeValue,
    gatewayOrderId: string
  ): Promise<PaymentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.payment.findFirst({ where: { tenantId, gatewayProvider, gatewayOrderId } })
    );
    return row ? toEntity(row) : null;
  }

  // Bundle B, Steps 3/4 — additive. Deliberately bypasses tenant scoping (plain `prisma`, not
  // `withTenantContext`) — mirrors PrismaWebhookEventRepository/PrismaBillingRunRepository's own
  // "platform-ops tier, no tenantId" discipline for exactly the same reason: a webhook has no
  // tenant to scope by yet, resolving one IS what this lookup is for. Uses the schema's own
  // global-unique compound index directly via `findUnique`, not `findFirst`.
  async findByGatewayOrderIdAnyTenant(
    gatewayProvider: PaymentGatewayProviderCodeValue,
    gatewayOrderId: string
  ): Promise<PaymentEntity | null> {
    const row = await prisma.payment.findUnique({
      where: { gatewayProvider_gatewayOrderId: { gatewayProvider, gatewayOrderId } },
    });
    return row ? toEntity(row) : null;
  }

  async findByGatewayPaymentIdAnyTenant(
    gatewayProvider: PaymentGatewayProviderCodeValue,
    gatewayPaymentId: string
  ): Promise<PaymentEntity | null> {
    const row = await prisma.payment.findUnique({
      where: { gatewayProvider_gatewayPaymentId: { gatewayProvider, gatewayPaymentId } },
    });
    return row ? toEntity(row) : null;
  }

  async create(input: CreatePaymentInput, tx?: Prisma.TransactionClient): Promise<PaymentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.payment.create({
          data: {
            tenantId: input.tenantId,
            subscriptionInvoiceId: input.subscriptionInvoiceId,
            gatewayProvider: input.gatewayProvider,
            gatewayOrderId: input.gatewayOrderId,
            amount: input.amount,
            currency: input.currency,
            method: input.method ?? null,
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
    input: UpdatePaymentStatusInput,
    tx?: Prisma.TransactionClient
  ): Promise<PaymentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.payment.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: input.status,
            gatewayPaymentId: input.gatewayPaymentId,
            gatewayResponseSnapshot: input.gatewayResponseSnapshot as Prisma.InputJsonValue | undefined,
            failureReason: input.failureReason,
            capturedAt: input.capturedAt,
            updatedBy: input.updatedBy,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async recordRefund(
    tenantId: string,
    id: string,
    input: RecordPaymentRefundInput,
    tx?: Prisma.TransactionClient
  ): Promise<PaymentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.payment.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: input.status,
            refundedAmount: input.refundedAmount,
            refundedAt: input.refundedAt,
            updatedBy: input.updatedBy,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
