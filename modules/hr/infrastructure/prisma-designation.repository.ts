import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Designation as PrismaDesignation, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateDesignationInput,
  DesignationRepository,
  UpdateDesignationInput,
} from "../domain/designation.repository";
import type { DesignationEntity } from "../domain/designation.entity";

function toEntity(row: PrismaDesignation): DesignationEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    departmentId: row.departmentId,
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

export class PrismaDesignationRepository implements DesignationRepository {
  async findById(tenantId: string, id: string): Promise<DesignationEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.designation.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<DesignationEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.designation.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean; departmentId?: string }): Promise<DesignationEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.designation.findMany({
        where: { tenantId, deletedAt: null, isActive: filter?.isActive, departmentId: filter?.departmentId },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateDesignationInput, tx?: Prisma.TransactionClient): Promise<DesignationEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.designation.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            departmentId: input.departmentId ?? null,
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

  async update(tenantId: string, id: string, input: UpdateDesignationInput, tx?: Prisma.TransactionClient): Promise<DesignationEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.designation.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            departmentId: input.departmentId,
            name: input.name,
            code: input.code,
            isActive: input.isActive,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<DesignationEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.designation.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
