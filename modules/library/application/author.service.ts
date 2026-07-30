import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaAuthorRepository } from "../infrastructure/prisma-author.repository";
import { AuthorNotFoundError } from "../domain/errors";
import { createAuthorSchema, updateAuthorSchema, type AuthorDTO } from "./dto/catalog.dto";
import type { AuthorEntity } from "../domain/author.entity";
import type { LibraryContext, LibraryCreateContext } from "./library.service";

function toDTO(entity: AuthorEntity): AuthorDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, biography: entity.biography, isActive: entity.isActive };
}

export async function createAuthor(input: unknown, context: LibraryCreateContext): Promise<AuthorDTO> {
  const parsed = createAuthorSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid author data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaAuthorRepository();
  const author = await repository.create({
    tenantId,
    schoolId,
    name: data.name,
    biography: data.biography ?? null,
    createdBy: actingUserId,
  });
  return toDTO(author);
}

export async function updateAuthor(id: string, input: unknown, context: LibraryContext): Promise<AuthorDTO> {
  const parsed = updateAuthorSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid author data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaAuthorRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new AuthorNotFoundError();

  const author = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
  return toDTO(author);
}

export async function deleteAuthor(id: string, context: LibraryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaAuthorRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new AuthorNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listAuthors(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<AuthorDTO[]> {
  const repository = new PrismaAuthorRepository();
  const authors = await repository.findMany(context.tenantId, filter);
  return authors.map(toDTO);
}

export { toDTO as toAuthorDTO };
