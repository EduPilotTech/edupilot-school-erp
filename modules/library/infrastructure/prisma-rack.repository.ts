import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Rack as PrismaRack } from "@/lib/generated/prisma/client";
import type { CreateRackInput, RackRepository, UpdateRackInput } from "../domain/rack.repository";
import type { RackEntity } from "../domain/rack.entity";

function toEntity(row: PrismaRack): RackEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    libraryId: row.libraryId,
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

export class PrismaRackRepository implements RackRepository {
  async findById(tenantId: string, id: string): Promise<RackEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.rack.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findByLibrary(tenantId: string, libraryId: string, filter?: { isActive?: boolean }): Promise<RackEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.rack.findMany({ where: { tenantId, libraryId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateRackInput): Promise<RackEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.rack.create({
        data: {
          tenantId: input.tenantId,
          libraryId: input.libraryId,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateRackInput): Promise<RackEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.rack.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, code: input.code, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<RackEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.rack.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
