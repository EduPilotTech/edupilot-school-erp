import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, FeeStructureItem as PrismaFeeStructureItem } from "@/lib/generated/prisma/client";
import type {
  CreateFeeStructureItemInput,
  FeeStructureItemRepository,
  UpdateFeeStructureItemInput,
} from "../domain/fee-structure.repository";
import type { FeeFrequencyValue, FeeStructureItemEntity } from "../domain/fee-structure.entity";

function toEntity(row: PrismaFeeStructureItem): FeeStructureItemEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    feeStructureId: row.feeStructureId,
    classId: row.classId,
    feeCategoryId: row.feeCategoryId,
    amount: row.amount.toNumber(),
    frequency: row.frequency as FeeFrequencyValue,
    dueDayOfMonth: row.dueDayOfMonth,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaFeeStructureItemRepository implements FeeStructureItemRepository {
  async findById(tenantId: string, id: string): Promise<FeeStructureItemEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeStructureItem.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByStructure(tenantId: string, feeStructureId: string): Promise<FeeStructureItemEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeStructureItem.findMany({
        where: { tenantId, feeStructureId, deletedAt: null },
        orderBy: [{ classId: "asc" }],
      })
    );
    return rows.map(toEntity);
  }

  async findByStructureAndClass(
    tenantId: string,
    feeStructureId: string,
    classId: string
  ): Promise<FeeStructureItemEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeStructureItem.findMany({
        where: { tenantId, feeStructureId, classId, deletedAt: null, isActive: true },
      })
    );
    return rows.map(toEntity);
  }

  async create(
    input: CreateFeeStructureItemInput,
    tx?: Prisma.TransactionClient
  ): Promise<FeeStructureItemEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.feeStructureItem.create({
          data: {
            tenantId: input.tenantId,
            feeStructureId: input.feeStructureId,
            classId: input.classId,
            feeCategoryId: input.feeCategoryId,
            amount: input.amount,
            frequency: input.frequency,
            dueDayOfMonth: input.dueDayOfMonth ?? null,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateFeeStructureItemInput
  ): Promise<FeeStructureItemEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeStructureItem.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          amount: input.amount,
          frequency: input.frequency,
          dueDayOfMonth: input.dueDayOfMonth,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FeeStructureItemEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeStructureItem.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
