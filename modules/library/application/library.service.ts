import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaLibraryRepository } from "../infrastructure/prisma-library.repository";
import { LibraryAlreadyExistsError, LibraryNotFoundError } from "../domain/errors";
import { createLibrarySchema, updateLibrarySchema, type LibraryDTO } from "./dto/library.dto";
import type { LibraryEntity } from "../domain/library.entity";

export interface LibraryContext {
  tenantId: string;
  actingUserId: string;
}

export interface LibraryCreateContext extends LibraryContext {
  schoolId: string;
}

function toDTO(entity: LibraryEntity): LibraryDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    name: entity.name,
    code: entity.code,
    address: entity.address,
    isActive: entity.isActive,
  };
}

export async function createLibrary(input: unknown, context: LibraryCreateContext): Promise<LibraryDTO> {
  const parsed = createLibrarySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid library data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaLibraryRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) {
    throw new LibraryAlreadyExistsError();
  }

  try {
    const library = await repository.create({
      tenantId,
      schoolId,
      name: data.name,
      code: data.code,
      address: data.address ?? null,
      createdBy: actingUserId,
    });
    return toDTO(library);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new LibraryAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateLibrary(libraryId: string, input: unknown, context: LibraryContext): Promise<LibraryDTO> {
  const parsed = updateLibrarySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid library data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaLibraryRepository();
  const existing = await repository.findById(tenantId, libraryId);
  if (!existing || existing.deletedAt !== null) {
    throw new LibraryNotFoundError();
  }

  try {
    const library = await repository.update(tenantId, libraryId, {
      name: data.name,
      code: data.code,
      address: data.address,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
    return toDTO(library);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new LibraryAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteLibrary(libraryId: string, context: LibraryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaLibraryRepository();
  const existing = await repository.findById(tenantId, libraryId);
  if (!existing || existing.deletedAt !== null) {
    throw new LibraryNotFoundError();
  }
  await repository.softDelete(tenantId, libraryId, actingUserId);
}

export async function listLibraries(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<LibraryDTO[]> {
  const repository = new PrismaLibraryRepository();
  const libraries = await repository.findMany(context.tenantId, filter);
  return libraries.map(toDTO);
}

export async function getLibrary(tenantId: string, libraryId: string): Promise<LibraryDTO | null> {
  const repository = new PrismaLibraryRepository();
  const library = await repository.findById(tenantId, libraryId);
  return library ? toDTO(library) : null;
}

export { toDTO as toLibraryDTO };
