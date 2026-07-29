import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, FeePayment as PrismaFeePayment } from "@/lib/generated/prisma/client";
import type { CreateFeePaymentInput, FeePaymentRepository } from "../domain/fee-payment.repository";
import type { FeePaymentEntity, FeePaymentModeValue, FeePaymentStatusValue } from "../domain/fee-payment.entity";

function toEntity(row: PrismaFeePayment): FeePaymentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    receiptNumber: row.receiptNumber,
    clientRequestId: row.clientRequestId,
    amount: row.amount.toNumber(),
    paymentMode: row.paymentMode as FeePaymentModeValue,
    status: row.status as FeePaymentStatusValue,
    paidAt: row.paidAt,
    collectedBy: row.collectedBy,
    remarks: row.remarks,
    gatewayProvider: row.gatewayProvider,
    gatewayTransactionId: row.gatewayTransactionId,
    gatewayOrderId: row.gatewayOrderId,
    reversedAt: row.reversedAt,
    reversedBy: row.reversedBy,
    reversalReason: row.reversalReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaFeePaymentRepository implements FeePaymentRepository {
  async findById(tenantId: string, id: string): Promise<FeePaymentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feePayment.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByClientRequestId(tenantId: string, clientRequestId: string): Promise<FeePaymentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feePayment.findUnique({ where: { tenantId_clientRequestId: { tenantId, clientRequestId } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByStudent(tenantId: string, studentId: string, academicSessionId: string): Promise<FeePaymentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feePayment.findMany({
        where: { tenantId, studentId, academicSessionId },
        orderBy: { paidAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByDateRange(
    tenantId: string,
    academicSessionId: string,
    from: Date,
    to: Date
  ): Promise<FeePaymentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feePayment.findMany({
        where: { tenantId, academicSessionId, paidAt: { gte: from, lte: to } },
        orderBy: { paidAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateFeePaymentInput, tx: Prisma.TransactionClient): Promise<FeePaymentEntity> {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${input.tenantId}, true)`;
    const row = await tx.feePayment.create({
      data: {
        tenantId: input.tenantId,
        studentId: input.studentId,
        academicSessionId: input.academicSessionId,
        receiptNumber: input.receiptNumber,
        clientRequestId: input.clientRequestId,
        amount: input.amount,
        paymentMode: input.paymentMode,
        collectedBy: input.collectedBy ?? null,
        remarks: input.remarks ?? null,
      },
    });
    return toEntity(row);
  }

  async reverse(
    tenantId: string,
    id: string,
    reversedBy: string | null,
    reason: string,
    tx: Prisma.TransactionClient
  ): Promise<FeePaymentEntity> {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const row = await tx.feePayment.update({
      where: { tenantId_id: { tenantId, id } },
      data: { status: "REVERSED", reversedAt: new Date(), reversedBy, reversalReason: reason },
    });
    return toEntity(row);
  }
}
