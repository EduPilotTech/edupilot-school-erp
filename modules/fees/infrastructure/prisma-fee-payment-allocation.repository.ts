import "server-only";
import type { Prisma, FeePaymentAllocation as PrismaFeePaymentAllocation } from "@/lib/generated/prisma/client";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type {
  CreateFeePaymentAllocationInput,
  FeePaymentAllocationRepository,
} from "../domain/fee-payment-allocation.repository";
import type { FeePaymentAllocationEntity } from "../domain/fee-payment-allocation.entity";

function toEntity(row: PrismaFeePaymentAllocation): FeePaymentAllocationEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    paymentId: row.paymentId,
    invoiceId: row.invoiceId,
    amountAllocated: row.amountAllocated.toNumber(),
    createdAt: row.createdAt,
  };
}

export class PrismaFeePaymentAllocationRepository implements FeePaymentAllocationRepository {
  async findByPayment(tenantId: string, paymentId: string): Promise<FeePaymentAllocationEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feePaymentAllocation.findMany({ where: { tenantId, paymentId } })
    );
    return rows.map(toEntity);
  }

  async findByInvoice(tenantId: string, invoiceId: string): Promise<FeePaymentAllocationEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feePaymentAllocation.findMany({ where: { tenantId, invoiceId } })
    );
    return rows.map(toEntity);
  }

  async create(
    input: CreateFeePaymentAllocationInput,
    tx: Prisma.TransactionClient
  ): Promise<FeePaymentAllocationEntity> {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${input.tenantId}, true)`;
    const row = await tx.feePaymentAllocation.create({
      data: {
        tenantId: input.tenantId,
        paymentId: input.paymentId,
        invoiceId: input.invoiceId,
        amountAllocated: input.amountAllocated,
      },
    });
    return toEntity(row);
  }
}
