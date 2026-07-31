import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { EmployeeBankDetail as PrismaEmployeeBankDetail, Prisma } from "@/lib/generated/prisma/client";
import type {
  EmployeeBankDetailRepository,
  UpsertEmployeeBankDetailInput,
} from "../domain/employee-bank-detail.repository";
import type { EmployeeBankDetailEntity } from "../domain/employee-bank-detail.entity";

function toEntity(row: PrismaEmployeeBankDetail): EmployeeBankDetailEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    accountHolderName: row.accountHolderName,
    accountNumber: row.accountNumber,
    bankName: row.bankName,
    branchName: row.branchName,
    ifscCode: row.ifscCode,
    accountType: row.accountType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaEmployeeBankDetailRepository implements EmployeeBankDetailRepository {
  async findByEmployeeId(tenantId: string, employeeId: string): Promise<EmployeeBankDetailEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employeeBankDetail.findUnique({ where: { tenantId_employeeId: { tenantId, employeeId } } })
    );
    return row ? toEntity(row) : null;
  }

  async upsert(input: UpsertEmployeeBankDetailInput, tx?: Prisma.TransactionClient): Promise<EmployeeBankDetailEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.employeeBankDetail.upsert({
          where: { tenantId_employeeId: { tenantId: input.tenantId, employeeId: input.employeeId } },
          create: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            accountHolderName: input.accountHolderName,
            accountNumber: input.accountNumber,
            bankName: input.bankName,
            branchName: input.branchName ?? null,
            ifscCode: input.ifscCode,
            accountType: input.accountType ?? null,
            createdBy: input.updatedBy ?? null,
            updatedBy: input.updatedBy ?? null,
          },
          update: {
            accountHolderName: input.accountHolderName,
            accountNumber: input.accountNumber,
            bankName: input.bankName,
            branchName: input.branchName ?? null,
            ifscCode: input.ifscCode,
            accountType: input.accountType ?? null,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
