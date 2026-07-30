import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { BookCategory as PrismaBookCategory } from "@/lib/generated/prisma/client";
import type {
  BookCategoryRepository,
  CreateBookCategoryInput,
  UpdateBookCategoryInput,
} from "../domain/book-category.repository";
import type { BookCategoryEntity } from "../domain/book-category.entity";

function toEntity(row: PrismaBookCategory): BookCategoryEntity {
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

export class PrismaBookCategoryRepository implements BookCategoryRepository {
  async findById(tenantId: string, id: string): Promise<BookCategoryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.bookCategory.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<BookCategoryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.bookCategory.findUnique({ where: { tenantId_code: { tenantId, code } } }));
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<BookCategoryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookCategory.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateBookCategoryInput): Promise<BookCategoryEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.bookCategory.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateBookCategoryInput): Promise<BookCategoryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookCategory.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, code: input.code, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<BookCategoryEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookCategory.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
