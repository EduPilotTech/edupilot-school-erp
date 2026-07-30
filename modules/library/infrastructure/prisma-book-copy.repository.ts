import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { BookCopy as PrismaBookCopy, Prisma } from "@/lib/generated/prisma/client";
import type { BookCopyRepository, CreateBookCopyInput, UpdateBookCopyInput } from "../domain/book-copy.repository";
import type { BookCopyEntity, BookCopyStatusValue } from "../domain/book-copy.entity";

function toEntity(row: PrismaBookCopy): BookCopyEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    bookId: row.bookId,
    shelfId: row.shelfId,
    accessionNumber: row.accessionNumber,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaBookCopyRepository implements BookCopyRepository {
  async findById(tenantId: string, id: string): Promise<BookCopyEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.bookCopy.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findByAccessionNumber(tenantId: string, accessionNumber: string): Promise<BookCopyEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookCopy.findUnique({ where: { tenantId_accessionNumber: { tenantId, accessionNumber } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByBook(tenantId: string, bookId: string): Promise<BookCopyEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookCopy.findMany({ where: { tenantId, bookId, deletedAt: null }, orderBy: { accessionNumber: "asc" } })
    );
    return rows.map(toEntity);
  }

  async findAvailableByBook(tenantId: string, bookId: string): Promise<BookCopyEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookCopy.findMany({
        where: { tenantId, bookId, deletedAt: null, status: "AVAILABLE" },
        orderBy: { accessionNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByShelf(tenantId: string, shelfId: string): Promise<BookCopyEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.bookCopy.findMany({ where: { tenantId, shelfId, deletedAt: null }, orderBy: { accessionNumber: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateBookCopyInput): Promise<BookCopyEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.bookCopy.create({
        data: {
          tenantId: input.tenantId,
          bookId: input.bookId,
          shelfId: input.shelfId ?? null,
          accessionNumber: input.accessionNumber,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateBookCopyInput): Promise<BookCopyEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookCopy.update({
        where: { tenantId_id: { tenantId, id } },
        data: { shelfId: input.shelfId, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async setStatus(
    tenantId: string,
    id: string,
    status: BookCopyStatusValue,
    tx?: Prisma.TransactionClient
  ): Promise<BookCopyEntity> {
    const row = await withTenantContext(tenantId, (client) => client.bookCopy.update({ where: { tenantId_id: { tenantId, id } }, data: { status } }), tx);
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<BookCopyEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.bookCopy.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
