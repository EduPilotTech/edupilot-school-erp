import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, SalaryStructure as PrismaSalaryStructure } from "@/lib/generated/prisma/client";
import type {
  CreateSalaryStructureInput,
  SalaryStructureRepository,
  UpdateSalaryStructureInput,
} from "../domain/salary-structure.repository";
import type { SalaryStructureEntity } from "../domain/salary-structure.entity";

function toEntity(row: PrismaSalaryStructure): SalaryStructureEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaSalaryStructureRepository implements SalaryStructureRepository {
  async findById(tenantId: string, id: string): Promise<SalaryStructureEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.salaryStructure.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByName(tenantId: string, schoolId: string, name: string): Promise<SalaryStructureEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.salaryStructure.findUnique({ where: { tenantId_schoolId_name: { tenantId, schoolId, name } } })
    );
    return row ? toEntity(row) : null;
  }

  async findBySchool(tenantId: string, schoolId: string): Promise<SalaryStructureEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.salaryStructure.findMany({
        where: { tenantId, schoolId, deletedAt: null },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateSalaryStructureInput, tx?: Prisma.TransactionClient): Promise<SalaryStructureEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.salaryStructure.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            name: input.name,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateSalaryStructureInput,
    tx?: Prisma.TransactionClient
  ): Promise<SalaryStructureEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.salaryStructure.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            name: input.name,
            isActive: input.isActive,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(
    tenantId: string,
    id: string,
    deletedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<SalaryStructureEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.salaryStructure.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
