import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, SalaryPayment as PrismaSalaryPayment } from "@/lib/generated/prisma/client";
import type {
  CreateSalaryPaymentInput,
  SalaryPaymentListFilter,
  SalaryPaymentRepository,
} from "../domain/salary-payment.repository";
import type { SalaryPaymentEntity, SalaryPaymentModeValue, SalaryPaymentStatusValue } from "../domain/salary-payment.entity";

function toEntity(row: PrismaSalaryPayment): SalaryPaymentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    payslipId: row.payslipId,
    employeeId: row.employeeId,
    amount: row.amount.toNumber(),
    paymentMode: row.paymentMode as SalaryPaymentModeValue,
    paymentDate: row.paymentDate,
    referenceNumber: row.referenceNumber,
    status: row.status as SalaryPaymentStatusValue,
    reversedAt: row.reversedAt,
    reversedBy: row.reversedBy,
    reversalReason: row.reversalReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaSalaryPaymentRepository implements SalaryPaymentRepository {
  async findById(tenantId: string, id: string): Promise<SalaryPaymentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.salaryPayment.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByPayslip(tenantId: string, payslipId: string): Promise<SalaryPaymentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.salaryPayment.findMany({ where: { tenantId, payslipId }, orderBy: { paymentDate: "asc" } })
    );
    return rows.map(toEntity);
  }

  async findMany(tenantId: string, filter: SalaryPaymentListFilter): Promise<SalaryPaymentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.salaryPayment.findMany({
        where: { tenantId, employeeId: filter.employeeId, payslipId: filter.payslipId },
        orderBy: { paymentDate: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateSalaryPaymentInput, tx: Prisma.TransactionClient): Promise<SalaryPaymentEntity> {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${input.tenantId}, true)`;
    const row = await tx.salaryPayment.create({
      data: {
        tenantId: input.tenantId,
        payslipId: input.payslipId,
        employeeId: input.employeeId,
        amount: input.amount,
        paymentMode: input.paymentMode,
        paymentDate: input.paymentDate,
        referenceNumber: input.referenceNumber ?? null,
        createdBy: input.createdBy ?? null,
        updatedBy: input.createdBy ?? null,
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
  ): Promise<SalaryPaymentEntity> {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    const row = await tx.salaryPayment.update({
      where: { tenantId_id: { tenantId, id } },
      data: { status: "REVERSED", reversedAt: new Date(), reversedBy, reversalReason: reason, updatedBy: reversedBy },
    });
    return toEntity(row);
  }
}
