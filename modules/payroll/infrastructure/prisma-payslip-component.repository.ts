import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, PayslipComponent as PrismaPayslipComponent } from "@/lib/generated/prisma/client";
import type { CreatePayslipComponentInput, PayslipComponentRepository } from "../domain/payroll-run.repository";
import type { PayslipComponentEntity } from "../domain/payroll-run.entity";
import type { SalaryComponentTypeValue } from "../domain/salary-structure.entity";

function toEntity(row: PrismaPayslipComponent): PayslipComponentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    payslipId: row.payslipId,
    salaryComponentId: row.salaryComponentId,
    name: row.name,
    componentType: row.componentType as SalaryComponentTypeValue,
    amount: row.amount.toNumber(),
  };
}

export class PrismaPayslipComponentRepository implements PayslipComponentRepository {
  async findByPayslip(tenantId: string, payslipId: string): Promise<PayslipComponentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.payslipComponent.findMany({ where: { tenantId, payslipId } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreatePayslipComponentInput, tx?: Prisma.TransactionClient): Promise<PayslipComponentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.payslipComponent.create({
          data: {
            tenantId: input.tenantId,
            payslipId: input.payslipId,
            salaryComponentId: input.salaryComponentId ?? null,
            name: input.name,
            componentType: input.componentType,
            amount: input.amount,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async createMany(inputs: CreatePayslipComponentInput[], tx?: Prisma.TransactionClient): Promise<void> {
    if (inputs.length === 0) return;
    const tenantId = inputs[0]!.tenantId;
    await withTenantContext(
      tenantId,
      (client) =>
        client.payslipComponent.createMany({
          data: inputs.map((input) => ({
            tenantId: input.tenantId,
            payslipId: input.payslipId,
            salaryComponentId: input.salaryComponentId ?? null,
            name: input.name,
            componentType: input.componentType,
            amount: input.amount,
          })),
        }),
      tx
    );
  }

  async deleteByPayslip(tenantId: string, payslipId: string, tx?: Prisma.TransactionClient): Promise<void> {
    await withTenantContext(
      tenantId,
      (client) => client.payslipComponent.deleteMany({ where: { tenantId, payslipId } }),
      tx
    );
  }
}
