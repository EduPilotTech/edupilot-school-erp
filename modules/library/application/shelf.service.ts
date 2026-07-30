import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaShelfRepository } from "../infrastructure/prisma-shelf.repository";
import { PrismaRackRepository } from "../infrastructure/prisma-rack.repository";
import { RackNotFoundError, ShelfAlreadyExistsError, ShelfNotFoundError } from "../domain/errors";
import { createShelfSchema, updateShelfSchema, type ShelfDTO } from "./dto/location.dto";
import type { ShelfEntity } from "../domain/shelf.entity";
import type { LibraryContext } from "./library.service";

function toDTO(entity: ShelfEntity): ShelfDTO {
  return { id: entity.id, rackId: entity.rackId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function createShelf(input: unknown, context: LibraryContext): Promise<ShelfDTO> {
  const parsed = createShelfSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid shelf data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const rackRepository = new PrismaRackRepository();
  const rack = await rackRepository.findById(tenantId, data.rackId);
  if (!rack || rack.deletedAt !== null) throw new RackNotFoundError();

  const repository = new PrismaShelfRepository();
  try {
    const shelf = await repository.create({ tenantId, rackId: data.rackId, name: data.name, code: data.code, createdBy: actingUserId });
    return toDTO(shelf);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ShelfAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateShelf(id: string, input: unknown, context: LibraryContext): Promise<ShelfDTO> {
  const parsed = updateShelfSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid shelf data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaShelfRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new ShelfNotFoundError();

  try {
    const shelf = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
    return toDTO(shelf);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ShelfAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteShelf(id: string, context: LibraryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaShelfRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new ShelfNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listShelvesByRack(tenantId: string, rackId: string, filter?: { isActive?: boolean }): Promise<ShelfDTO[]> {
  const repository = new PrismaShelfRepository();
  const shelves = await repository.findByRack(tenantId, rackId, filter);
  return shelves.map(toDTO);
}

export async function getShelf(tenantId: string, id: string): Promise<ShelfDTO | null> {
  const repository = new PrismaShelfRepository();
  const shelf = await repository.findById(tenantId, id);
  return shelf ? toDTO(shelf) : null;
}

export { toDTO as toShelfDTO };
