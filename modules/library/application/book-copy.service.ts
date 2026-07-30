import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaBookCopyRepository } from "../infrastructure/prisma-book-copy.repository";
import { PrismaBookRepository } from "../infrastructure/prisma-book.repository";
import { PrismaLibraryRepository } from "../infrastructure/prisma-library.repository";
import { PrismaShelfRepository } from "../infrastructure/prisma-shelf.repository";
import {
  BookCopyAlreadyExistsError,
  BookCopyHasOpenIssueError,
  BookCopyNotFoundError,
  BookNotFoundError,
  ShelfNotFoundError,
} from "../domain/errors";
import { createBookCopySchema, updateBookCopyShelfSchema, type BookCopyDTO } from "./dto/location.dto";
import type { BookCopyEntity } from "../domain/book-copy.entity";
import type { LibraryContext } from "./library.service";

function toDTO(entity: BookCopyEntity): BookCopyDTO {
  return { id: entity.id, bookId: entity.bookId, shelfId: entity.shelfId, accessionNumber: entity.accessionNumber, status: entity.status };
}

// Accession numbers auto-generate when the librarian doesn't supply one — prefixed with the
// owning Library's code, followed by a timestamp/random suffix so no read-then-write race is
// needed; the DB's own unique(tenantId, accessionNumber) constraint is the final backstop (see
// the P2002 retry below). Both the printable QR code and the Code128 barcode are rendered
// directly from this value at label render time — there is no separate stored encoding.
function generateAccessionNumber(libraryCode: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${libraryCode}-${stamp}${random}`;
}

export async function createBookCopy(input: unknown, context: LibraryContext): Promise<BookCopyDTO> {
  const parsed = createBookCopySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid book copy data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const bookRepository = new PrismaBookRepository();
  const book = await bookRepository.findById(tenantId, data.bookId);
  if (!book || book.deletedAt !== null) throw new BookNotFoundError();

  if (data.shelfId) {
    const shelfRepository = new PrismaShelfRepository();
    const shelf = await shelfRepository.findById(tenantId, data.shelfId);
    if (!shelf || shelf.deletedAt !== null) throw new ShelfNotFoundError();
  }

  const repository = new PrismaBookCopyRepository();

  if (data.accessionNumber) {
    const existing = await repository.findByAccessionNumber(tenantId, data.accessionNumber);
    if (existing) throw new BookCopyAlreadyExistsError();
    const copy = await repository.create({
      tenantId,
      bookId: data.bookId,
      shelfId: data.shelfId ?? null,
      accessionNumber: data.accessionNumber,
      createdBy: actingUserId,
    });
    return toDTO(copy);
  }

  const libraryRepository = new PrismaLibraryRepository();
  const library = await libraryRepository.findById(tenantId, book.libraryId);
  if (!library) throw new BookNotFoundError();

  for (let attempt = 0; attempt < 3; attempt++) {
    const accessionNumber = generateAccessionNumber(library.code);
    try {
      const copy = await repository.create({
        tenantId,
        bookId: data.bookId,
        shelfId: data.shelfId ?? null,
        accessionNumber,
        createdBy: actingUserId,
      });
      return toDTO(copy);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2) {
        continue;
      }
      throw error;
    }
  }
  throw new BookCopyAlreadyExistsError();
}

export async function updateBookCopyShelf(id: string, input: unknown, context: LibraryContext): Promise<BookCopyDTO> {
  const parsed = updateBookCopyShelfSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid shelf assignment.");
  }
  const { tenantId, actingUserId } = context;

  const repository = new PrismaBookCopyRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new BookCopyNotFoundError();

  if (parsed.data.shelfId) {
    const shelfRepository = new PrismaShelfRepository();
    const shelf = await shelfRepository.findById(tenantId, parsed.data.shelfId);
    if (!shelf || shelf.deletedAt !== null) throw new ShelfNotFoundError();
  }

  const copy = await repository.update(tenantId, id, { shelfId: parsed.data.shelfId, updatedBy: actingUserId });
  return toDTO(copy);
}

export async function deleteBookCopy(id: string, context: LibraryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaBookCopyRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new BookCopyNotFoundError();
  if (existing.status === "ISSUED" || existing.status === "RESERVED") {
    throw new BookCopyHasOpenIssueError();
  }
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listBookCopiesByBook(tenantId: string, bookId: string): Promise<BookCopyDTO[]> {
  const repository = new PrismaBookCopyRepository();
  const copies = await repository.findByBook(tenantId, bookId);
  return copies.map(toDTO);
}

export async function listBookCopiesByShelf(tenantId: string, shelfId: string): Promise<BookCopyDTO[]> {
  const repository = new PrismaBookCopyRepository();
  const copies = await repository.findByShelf(tenantId, shelfId);
  return copies.map(toDTO);
}

export async function getBookCopy(tenantId: string, id: string): Promise<BookCopyDTO | null> {
  const repository = new PrismaBookCopyRepository();
  const copy = await repository.findById(tenantId, id);
  return copy ? toDTO(copy) : null;
}

export { toDTO as toBookCopyDTO };
