import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaRackRepository } from "../infrastructure/prisma-rack.repository";
import { PrismaLibraryRepository } from "../infrastructure/prisma-library.repository";
import { LibraryNotFoundError, RackAlreadyExistsError, RackNotFoundError } from "../domain/errors";
import { createRackSchema, updateRackSchema, type RackDTO } from "./dto/location.dto";
import type { RackEntity } from "../domain/rack.entity";
import type { LibraryContext } from "./library.service";

function toDTO(entity: RackEntity): RackDTO {
  return { id: entity.id, libraryId: entity.libraryId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function createRack(input: unknown, context: LibraryContext): Promise<RackDTO> {
  const parsed = createRackSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid rack data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const libraryRepository = new PrismaLibraryRepository();
  const library = await libraryRepository.findById(tenantId, data.libraryId);
  if (!library || library.deletedAt !== null) throw new LibraryNotFoundError();

  const repository = new PrismaRackRepository();
  try {
    const rack = await repository.create({ tenantId, libraryId: data.libraryId, name: data.name, code: data.code, createdBy: actingUserId });
    return toDTO(rack);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new RackAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateRack(id: string, input: unknown, context: LibraryContext): Promise<RackDTO> {
  const parsed = updateRackSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid rack data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaRackRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new RackNotFoundError();

  try {
    const rack = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(rack);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new RackAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteRack(id: string, context: LibraryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaRackRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new RackNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listRacksByLibrary(tenantId: string, libraryId: string, filter?: { isActive?: boolean }): Promise<RackDTO[]> {
  const repository = new PrismaRackRepository();
  const racks = await repository.findByLibrary(tenantId, libraryId, filter);
  return racks.map(toDTO);
}

export async function getRack(tenantId: string, id: string): Promise<RackDTO | null> {
  const repository = new PrismaRackRepository();
  const rack = await repository.findById(tenantId, id);
  return rack ? toDTO(rack) : null;
}

export { toDTO as toRackDTO };
