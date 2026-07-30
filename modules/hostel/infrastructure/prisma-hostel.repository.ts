import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Hostel as PrismaHostel } from "@/lib/generated/prisma/client";
import type { CreateHostelInput, HostelRepository, UpdateHostelInput } from "../domain/hostel.repository";
import type { HostelEntity } from "../domain/hostel.entity";

function toEntity(row: PrismaHostel): HostelEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    code: row.code,
    type: row.type,
    address: row.address,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHostelRepository implements HostelRepository {
  async findById(tenantId: string, id: string): Promise<HostelEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostel.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<HostelEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostel.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<HostelEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostel.findMany({
        where: { tenantId, deletedAt: null, isActive: filter?.isActive },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelInput): Promise<HostelEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostel.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          code: input.code,
          type: input.type,
          address: input.address ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateHostelInput): Promise<HostelEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostel.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          code: input.code,
          type: input.type,
          address: input.address,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostel.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
