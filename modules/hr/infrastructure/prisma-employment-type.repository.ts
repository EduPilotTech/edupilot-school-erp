import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { EmploymentType as PrismaEmploymentType, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateEmploymentTypeInput,
  EmploymentTypeRepository,
  UpdateEmploymentTypeInput,
} from "../domain/employment-type.repository";
import type { EmploymentTypeEntity } from "../domain/employment-type.entity";

function toEntity(row: PrismaEmploymentType): EmploymentTypeEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    code: row.code,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaEmploymentTypeRepository implements EmploymentTypeRepository {
  async findById(tenantId: string, id: string): Promise<EmploymentTypeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employmentType.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<EmploymentTypeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employmentType.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<EmploymentTypeEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.employmentType.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateEmploymentTypeInput, tx?: Prisma.TransactionClient): Promise<EmploymentTypeEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.employmentType.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            name: input.name,
            code: input.code,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateEmploymentTypeInput, tx?: Prisma.TransactionClient): Promise<EmploymentTypeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employmentType.update({
          where: { tenantId_id: { tenantId, id } },
          data: { name: input.name, code: input.code, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<EmploymentTypeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employmentType.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
