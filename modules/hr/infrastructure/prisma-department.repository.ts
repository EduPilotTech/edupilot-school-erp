import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Department as PrismaDepartment, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateDepartmentInput,
  DepartmentRepository,
  UpdateDepartmentInput,
} from "../domain/department.repository";
import type { DepartmentEntity } from "../domain/department.entity";

function toEntity(row: PrismaDepartment): DepartmentEntity {
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

export class PrismaDepartmentRepository implements DepartmentRepository {
  async findById(tenantId: string, id: string): Promise<DepartmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.department.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<DepartmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.department.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<DepartmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.department.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateDepartmentInput, tx?: Prisma.TransactionClient): Promise<DepartmentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.department.create({
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

  async update(tenantId: string, id: string, input: UpdateDepartmentInput, tx?: Prisma.TransactionClient): Promise<DepartmentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.department.update({
          where: { tenantId_id: { tenantId, id } },
          data: { name: input.name, code: input.code, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<DepartmentEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.department.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
