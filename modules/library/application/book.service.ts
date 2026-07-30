import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaBookRepository } from "../infrastructure/prisma-book.repository";
import { PrismaLibraryRepository } from "../infrastructure/prisma-library.repository";
import { BookNotFoundError, LibraryNotFoundError } from "../domain/errors";
import { createBookSchema, updateBookSchema, type BookDTO } from "./dto/catalog.dto";
import type { BookEntity } from "../domain/book.entity";
import type { BookFilter } from "../domain/book.repository";
import type { LibraryContext } from "./library.service";

function toDTO(entity: BookEntity): BookDTO {
  return {
    id: entity.id,
    libraryId: entity.libraryId,
    bookCategoryId: entity.bookCategoryId,
    authorId: entity.authorId,
    publisherId: entity.publisherId,
    academicSubjectId: entity.academicSubjectId,
    title: entity.title,
    isbn: entity.isbn,
    language: entity.language,
    edition: entity.edition,
    description: entity.description,
    replacementCost: entity.replacementCost,
    isActive: entity.isActive,
  };
}

export async function createBook(input: unknown, context: LibraryContext): Promise<BookDTO> {
  const parsed = createBookSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid book data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const libraryRepository = new PrismaLibraryRepository();
  const library = await libraryRepository.findById(tenantId, data.libraryId);
  if (!library || library.deletedAt !== null) {
    throw new LibraryNotFoundError();
  }

  const repository = new PrismaBookRepository();
  const book = await repository.create({
    tenantId,
    libraryId: data.libraryId,
    bookCategoryId: data.bookCategoryId,
    authorId: data.authorId,
    publisherId: data.publisherId,
    academicSubjectId: data.academicSubjectId ?? null,
    title: data.title,
    isbn: data.isbn ?? null,
    language: data.language,
    edition: data.edition ?? null,
    description: data.description ?? null,
    replacementCost: data.replacementCost,
    createdBy: actingUserId,
  });
  return toDTO(book);
}

export async function updateBook(id: string, input: unknown, context: LibraryContext): Promise<BookDTO> {
  const parsed = updateBookSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid book data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaBookRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new BookNotFoundError();

  const book = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
  return toDTO(book);
}

export async function deleteBook(id: string, context: LibraryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaBookRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new BookNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listBooksByLibrary(tenantId: string, libraryId: string, filter?: BookFilter): Promise<BookDTO[]> {
  const repository = new PrismaBookRepository();
  const books = await repository.findByLibrary(tenantId, libraryId, filter);
  return books.map(toDTO);
}

export async function getBook(tenantId: string, id: string): Promise<BookDTO | null> {
  const repository = new PrismaBookRepository();
  const book = await repository.findById(tenantId, id);
  return book ? toDTO(book) : null;
}

export { toDTO as toBookDTO };
