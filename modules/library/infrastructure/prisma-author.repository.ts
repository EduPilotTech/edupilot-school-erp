import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Author as PrismaAuthor } from "@/lib/generated/prisma/client";
import type { AuthorRepository, CreateAuthorInput, UpdateAuthorInput } from "../domain/author.repository";
import type { AuthorEntity } from "../domain/author.entity";

function toEntity(row: PrismaAuthor): AuthorEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    biography: row.biography,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaAuthorRepository implements AuthorRepository {
  async findById(tenantId: string, id: string): Promise<AuthorEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.author.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<AuthorEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.author.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateAuthorInput): Promise<AuthorEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.author.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          biography: input.biography ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateAuthorInput): Promise<AuthorEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.author.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, biography: input.biography, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<AuthorEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.author.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
