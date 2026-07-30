import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Library as PrismaLibrary } from "@/lib/generated/prisma/client";
import type { CreateLibraryInput, LibraryRepository, UpdateLibraryInput } from "../domain/library.repository";
import type { LibraryEntity } from "../domain/library.entity";

function toEntity(row: PrismaLibrary): LibraryEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    code: row.code,
    address: row.address,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaLibraryRepository implements LibraryRepository {
  async findById(tenantId: string, id: string): Promise<LibraryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.library.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<LibraryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.library.findUnique({ where: { tenantId_code: { tenantId, code } } }));
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<LibraryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.library.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateLibraryInput): Promise<LibraryEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.library.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          code: input.code,
          address: input.address ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateLibraryInput): Promise<LibraryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.library.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          code: input.code,
          address: input.address,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<LibraryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.library.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
