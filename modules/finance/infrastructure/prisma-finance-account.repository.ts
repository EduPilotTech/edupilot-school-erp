import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { FinanceAccount as PrismaFinanceAccount, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateFinanceAccountInput,
  FinanceAccountListFilter,
  FinanceAccountRepository,
  UpdateFinanceAccountInput,
} from "../domain/finance-account.repository";
import type { FinanceAccountEntity, FinanceAccountTypeValue } from "../domain/finance-account.entity";

function toEntity(row: PrismaFinanceAccount): FinanceAccountEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    accountType: row.accountType as FinanceAccountTypeValue,
    openingBalance: row.openingBalance.toNumber(),
    currentBalance: row.currentBalance.toNumber(),
    isDefault: row.isDefault,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaFinanceAccountRepository implements FinanceAccountRepository {
  async findById(tenantId: string, id: string): Promise<FinanceAccountEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.financeAccount.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByName(tenantId: string, schoolId: string, name: string): Promise<FinanceAccountEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.financeAccount.findFirst({
        where: { tenantId, schoolId, deletedAt: null, name: { equals: name, mode: "insensitive" } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, schoolId: string, filter?: FinanceAccountListFilter): Promise<FinanceAccountEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.financeAccount.findMany({
        where: { tenantId, schoolId, deletedAt: null, isActive: filter?.isActive, accountType: filter?.accountType },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateFinanceAccountInput, tx?: Prisma.TransactionClient): Promise<FinanceAccountEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.financeAccount.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            name: input.name,
            accountType: input.accountType,
            openingBalance: input.openingBalance,
            currentBalance: input.openingBalance,
            isDefault: input.isDefault ?? false,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateFinanceAccountInput, tx?: Prisma.TransactionClient): Promise<FinanceAccountEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.financeAccount.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            name: input.name,
            accountType: input.accountType,
            isDefault: input.isDefault,
            isActive: input.isActive,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FinanceAccountEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.financeAccount.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async unsetDefaultForSchool(tenantId: string, schoolId: string, exceptId: string | undefined, tx: Prisma.TransactionClient): Promise<void> {
    await withTenantContext(
      tenantId,
      (client) =>
        client.financeAccount.updateMany({
          where: { tenantId, schoolId, isDefault: true, id: exceptId ? { not: exceptId } : undefined },
          data: { isDefault: false },
        }),
      tx
    );
  }

  async adjustBalance(tenantId: string, id: string, delta: number, tx: Prisma.TransactionClient): Promise<FinanceAccountEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.financeAccount.update({
          where: { tenantId_id: { tenantId, id } },
          data: { currentBalance: { increment: delta } },
        }),
      tx
    );
    return toEntity(row);
  }
}
