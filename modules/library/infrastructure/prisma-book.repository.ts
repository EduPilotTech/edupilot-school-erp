import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Book as PrismaBook, Prisma } from "@/lib/generated/prisma/client";
import type { BookFilter, BookRepository, CreateBookInput, UpdateBookInput } from "../domain/book.repository";
import type { BookEntity } from "../domain/book.entity";

function toEntity(row: PrismaBook): BookEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    libraryId: row.libraryId,
    bookCategoryId: row.bookCategoryId,
    authorId: row.authorId,
    publisherId: row.publisherId,
    academicSubjectId: row.academicSubjectId,
    title: row.title,
    isbn: row.isbn,
    language: row.language,
    edition: row.edition,
    description: row.description,
    replacementCost: row.replacementCost.toNumber(),
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaBookRepository implements BookRepository {
  async findById(tenantId: string, id: string): Promise<BookEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.book.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findByLibrary(tenantId: string, libraryId: string, filter?: BookFilter): Promise<BookEntity[]> {
    const where: Prisma.BookWhereInput = {
      tenantId,
      libraryId,
      deletedAt: null,
      isActive: filter?.isActive,
      bookCategoryId: filter?.bookCategoryId,
      authorId: filter?.authorId,
    };
    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: "insensitive" } },
        { isbn: { contains: filter.search, mode: "insensitive" } },
      ];
    }
    const rows = await withTenantContext(tenantId, (tx) => tx.book.findMany({ where, orderBy: { title: "asc" } }));
    return rows.map(toEntity);
  }

  async create(input: CreateBookInput): Promise<BookEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.book.create({
        data: {
          tenantId: input.tenantId,
          libraryId: input.libraryId,
          bookCategoryId: input.bookCategoryId,
          authorId: input.authorId,
          publisherId: input.publisherId,
          academicSubjectId: input.academicSubjectId ?? null,
          title: input.title,
          isbn: input.isbn ?? null,
          language: input.language,
          edition: input.edition ?? null,
          description: input.description ?? null,
          replacementCost: input.replacementCost ?? 0,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateBookInput): Promise<BookEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.book.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          bookCategoryId: input.bookCategoryId,
          authorId: input.authorId,
          publisherId: input.publisherId,
          academicSubjectId: input.academicSubjectId,
          title: input.title,
          isbn: input.isbn,
          language: input.language,
          edition: input.edition,
          description: input.description,
          replacementCost: input.replacementCost,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<BookEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.book.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
