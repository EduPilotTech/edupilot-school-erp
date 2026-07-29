import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { FeeStructure as PrismaFeeStructure } from "@/lib/generated/prisma/client";
import type {
  CreateFeeStructureInput,
  FeeStructureRepository,
  UpdateFeeStructureInput,
} from "../domain/fee-structure.repository";
import type { FeeStructureEntity } from "../domain/fee-structure.entity";

function toEntity(row: PrismaFeeStructure): FeeStructureEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaFeeStructureRepository implements FeeStructureRepository {
  async findById(tenantId: string, id: string): Promise<FeeStructureEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeStructure.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByName(
    tenantId: string,
    academicSessionId: string,
    name: string
  ): Promise<FeeStructureEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeStructure.findUnique({
        where: { tenantId_academicSessionId_name: { tenantId, academicSessionId, name } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<FeeStructureEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.feeStructure.findMany({
        where: { tenantId, academicSessionId, deletedAt: null },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateFeeStructureInput): Promise<FeeStructureEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.feeStructure.create({
        data: {
          tenantId: input.tenantId,
          academicSessionId: input.academicSessionId,
          name: input.name,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateFeeStructureInput): Promise<FeeStructureEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeStructure.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<FeeStructureEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.feeStructure.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
