import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Helper as PrismaHelper } from "@/lib/generated/prisma/client";
import type { CreateHelperInput, HelperRepository, UpdateHelperInput } from "../domain/helper.repository";
import type { HelperEntity } from "../domain/helper.entity";

function toEntity(row: PrismaHelper): HelperEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userProfileId: row.userProfileId,
    employeeCode: row.employeeCode,
    fullName: row.fullName,
    phone: row.phone,
    address: row.address,
    dateOfJoining: row.dateOfJoining,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHelperRepository implements HelperRepository {
  async findById(tenantId: string, id: string): Promise<HelperEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.helper.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByEmployeeCode(tenantId: string, employeeCode: string): Promise<HelperEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.helper.findUnique({ where: { tenantId_employeeCode: { tenantId, employeeCode } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<HelperEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.helper.findMany({
        where: { tenantId, deletedAt: null, isActive: filter?.isActive },
        orderBy: { fullName: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHelperInput): Promise<HelperEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.helper.create({
        data: {
          tenantId: input.tenantId,
          employeeCode: input.employeeCode,
          fullName: input.fullName,
          phone: input.phone ?? null,
          address: input.address ?? null,
          dateOfJoining: input.dateOfJoining ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateHelperInput): Promise<HelperEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.helper.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          fullName: input.fullName,
          phone: input.phone,
          address: input.address,
          dateOfJoining: input.dateOfJoining,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HelperEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.helper.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
