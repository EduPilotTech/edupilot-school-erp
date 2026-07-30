import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Shelf as PrismaShelf } from "@/lib/generated/prisma/client";
import type { CreateShelfInput, ShelfRepository, UpdateShelfInput } from "../domain/shelf.repository";
import type { ShelfEntity } from "../domain/shelf.entity";

function toEntity(row: PrismaShelf): ShelfEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    rackId: row.rackId,
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

export class PrismaShelfRepository implements ShelfRepository {
  async findById(tenantId: string, id: string): Promise<ShelfEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.shelf.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findByRack(tenantId: string, rackId: string, filter?: { isActive?: boolean }): Promise<ShelfEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.shelf.findMany({ where: { tenantId, rackId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateShelfInput): Promise<ShelfEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.shelf.create({
        data: {
          tenantId: input.tenantId,
          rackId: input.rackId,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateShelfInput): Promise<ShelfEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.shelf.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, code: input.code, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ShelfEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.shelf.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
