import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaBookCategoryRepository } from "../infrastructure/prisma-book-category.repository";
import { BookCategoryAlreadyExistsError, BookCategoryNotFoundError } from "../domain/errors";
import { createBookCategorySchema, updateBookCategorySchema, type BookCategoryDTO } from "./dto/catalog.dto";
import type { BookCategoryEntity } from "../domain/book-category.entity";
import type { LibraryContext, LibraryCreateContext } from "./library.service";

function toDTO(entity: BookCategoryEntity): BookCategoryDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function createBookCategory(input: unknown, context: LibraryCreateContext): Promise<BookCategoryDTO> {
  const parsed = createBookCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid category data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaBookCategoryRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) throw new BookCategoryAlreadyExistsError();

  try {
    const category = await repository.create({ tenantId, schoolId, name: data.name, code: data.code, createdBy: actingUserId });
    return toDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BookCategoryAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateBookCategory(id: string, input: unknown, context: LibraryContext): Promise<BookCategoryDTO> {
  const parsed = updateBookCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid category data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaBookCategoryRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new BookCategoryNotFoundError();

  try {
    const category = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BookCategoryAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteBookCategory(id: string, context: LibraryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaBookCategoryRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new BookCategoryNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listBookCategories(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<BookCategoryDTO[]> {
  const repository = new PrismaBookCategoryRepository();
  const categories = await repository.findMany(context.tenantId, filter);
  return categories.map(toDTO);
}

export { toDTO as toBookCategoryDTO };
