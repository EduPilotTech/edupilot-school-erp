import type { Prisma } from "@/lib/generated/prisma/client";
import type { BookCopyEntity, BookCopyStatusValue } from "./book-copy.entity";

export interface CreateBookCopyInput {
  tenantId: string;
  bookId: string;
  shelfId?: string | null;
  accessionNumber: string;
  createdBy?: string | null;
}

export interface UpdateBookCopyInput {
  shelfId?: string | null;
  updatedBy?: string | null;
}

export interface BookCopyRepository {
  findById(tenantId: string, id: string): Promise<BookCopyEntity | null>;
  findByAccessionNumber(tenantId: string, accessionNumber: string): Promise<BookCopyEntity | null>;
  findByBook(tenantId: string, bookId: string): Promise<BookCopyEntity[]>;
  findAvailableByBook(tenantId: string, bookId: string): Promise<BookCopyEntity[]>;
  findByShelf(tenantId: string, shelfId: string): Promise<BookCopyEntity[]>;
  create(input: CreateBookCopyInput): Promise<BookCopyEntity>;
  update(tenantId: string, id: string, input: UpdateBookCopyInput): Promise<BookCopyEntity>;
  // Transactionally maintained by the circulation services — see BookCopyEntity's own comment.
  setStatus(
    tenantId: string,
    id: string,
    status: BookCopyStatusValue,
    tx?: Prisma.TransactionClient
  ): Promise<BookCopyEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<BookCopyEntity>;
}
