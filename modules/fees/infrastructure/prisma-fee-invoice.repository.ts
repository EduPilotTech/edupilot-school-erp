import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, FeeInvoice as PrismaFeeInvoice } from "@/lib/generated/prisma/client";
import type {
  CreateFeeInvoiceInput,
  FeeInvoiceListFilter,
  FeeInvoiceRepository,
} from "../domain/fee-invoice.repository";
import type { FeeInvoiceEntity, FeeInvoiceStatusValue } from "../domain/fee-invoice.entity";

function toEntity(row: PrismaFeeInvoice): FeeInvoiceEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    classId: row.classId,
    feeCategoryId: row.feeCategoryId,
    feeStructureItemId: row.feeStructureItemId,
    routeFeeRuleId: row.routeFeeRuleId,
    hostelFeeRuleId: row.hostelFeeRuleId,
    bookIssueId: row.bookIssueId,
    installmentPlanId: row.installmentPlanId,
    installmentNumber: row.installmentNumber,
    appliedConcessionId: row.appliedConcessionId,
    invoiceNumber: row.invoiceNumber,
    billingPeriod: row.billingPeriod,
    amount: row.amount.toNumber(),
    discountAmount: row.discountAmount.toNumber(),
    fineAmount: row.fineAmount.toNumber(),
    amountPaid: row.amountPaid.toNumber(),
    taxAmount: row.taxAmount ? row.taxAmount.toNumber() : null,
    dueDate: row.dueDate,
    status: row.status as FeeInvoiceStatusValue,
    cancelledAt: row.cancelledAt,
    cancelledBy: row.cancelledBy,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaFeeInvoiceRepository implements FeeInvoiceRepository {
  async findById(tenantId: string, id: string): Promise<FeeInvoiceEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByIds(tenantId: string, ids: string[]): Promise<FeeInvoiceEntity[]> {
    if (ids.length === 0) return [];
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findMany({ where: { tenantId, id: { in: ids } } })
    );
    return rows.map(toEntity);
  }

  async findByStudentAndItemAndPeriod(
    tenantId: string,
    studentId: string,
    feeStructureItemId: string,
    billingPeriod: string
  ): Promise<FeeInvoiceEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findUnique({
        where: {
          tenantId_studentId_feeStructureItemId_billingPeriod: {
            tenantId,
            studentId,
            feeStructureItemId,
            billingPeriod,
          },
        },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByStudentAndRouteFeeRuleAndPeriod(
    tenantId: string,
    studentId: string,
    routeFeeRuleId: string,
    billingPeriod: string
  ): Promise<FeeInvoiceEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findUnique({
        where: {
          tenantId_studentId_routeFeeRuleId_billingPeriod: {
            tenantId,
            studentId,
            routeFeeRuleId,
            billingPeriod,
          },
        },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByStudentAndHostelFeeRuleAndPeriod(
    tenantId: string,
    studentId: string,
    hostelFeeRuleId: string,
    billingPeriod: string
  ): Promise<FeeInvoiceEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findUnique({
        where: {
          tenantId_studentId_hostelFeeRuleId_billingPeriod: {
            tenantId,
            studentId,
            hostelFeeRuleId,
            billingPeriod,
          },
        },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByBookIssue(tenantId: string, bookIssueId: string): Promise<FeeInvoiceEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findUnique({ where: { tenantId_bookIssueId: { tenantId, bookIssueId } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByStudent(tenantId: string, studentId: string, academicSessionId: string): Promise<FeeInvoiceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findMany({
        where: { tenantId, studentId, academicSessionId },
        orderBy: [{ dueDate: "asc" }],
      })
    );
    return rows.map(toEntity);
  }

  async findMany(tenantId: string, filter: FeeInvoiceListFilter): Promise<FeeInvoiceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findMany({
        where: {
          tenantId,
          academicSessionId: filter.academicSessionId,
          classId: filter.classId,
          status: filter.status,
        },
        orderBy: [{ dueDate: "asc" }],
      })
    );
    return rows.map(toEntity);
  }

  async findOutstandingByStudent(tenantId: string, studentId: string): Promise<FeeInvoiceEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeInvoice.findMany({
        where: { tenantId, studentId, status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] } },
        orderBy: [{ dueDate: "asc" }],
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateFeeInvoiceInput, tx?: Prisma.TransactionClient): Promise<FeeInvoiceEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.feeInvoice.create({
          data: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            academicSessionId: input.academicSessionId,
            classId: input.classId,
            feeCategoryId: input.feeCategoryId,
            feeStructureItemId: input.feeStructureItemId ?? null,
            routeFeeRuleId: input.routeFeeRuleId ?? null,
            hostelFeeRuleId: input.hostelFeeRuleId ?? null,
            bookIssueId: input.bookIssueId ?? null,
            installmentPlanId: input.installmentPlanId ?? null,
            installmentNumber: input.installmentNumber ?? null,
            appliedConcessionId: input.appliedConcessionId ?? null,
            invoiceNumber: input.invoiceNumber,
            billingPeriod: input.billingPeriod,
            amount: input.amount,
            discountAmount: input.discountAmount ?? 0,
            taxAmount: input.taxAmount ?? null,
            dueDate: input.dueDate,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async applyPayment(
    tenantId: string,
    id: string,
    amountApplied: number,
    fineChargedNow: number,
    status: FeeInvoiceStatusValue,
    tx: Prisma.TransactionClient
  ): Promise<FeeInvoiceEntity> {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const row = await tx.feeInvoice.update({
      where: { tenantId_id: { tenantId, id } },
      data: {
        amountPaid: { increment: amountApplied },
        fineAmount: fineChargedNow,
        status,
      },
    });
    return toEntity(row);
  }

  async rollbackPayment(
    tenantId: string,
    id: string,
    amountToRollback: number,
    status: FeeInvoiceStatusValue,
    tx: Prisma.TransactionClient
  ): Promise<FeeInvoiceEntity> {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const row = await tx.feeInvoice.update({
      where: { tenantId_id: { tenantId, id } },
      data: {
        amountPaid: { decrement: amountToRollback },
        status,
      },
    });
    return toEntity(row);
  }

  async cancel(
    tenantId: string,
    id: string,
    cancelledBy: string | null,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<FeeInvoiceEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.feeInvoice.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledBy,
            cancellationReason: reason,
            updatedBy: cancelledBy,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
