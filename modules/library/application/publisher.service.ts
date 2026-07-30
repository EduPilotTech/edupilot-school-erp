import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaPublisherRepository } from "../infrastructure/prisma-publisher.repository";
import { PublisherNotFoundError } from "../domain/errors";
import { createPublisherSchema, updatePublisherSchema, type PublisherDTO } from "./dto/catalog.dto";
import type { PublisherEntity } from "../domain/publisher.entity";
import type { LibraryContext, LibraryCreateContext } from "./library.service";

function toDTO(entity: PublisherEntity): PublisherDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, isActive: entity.isActive };
}

export async function createPublisher(input: unknown, context: LibraryCreateContext): Promise<PublisherDTO> {
  const parsed = createPublisherSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid publisher data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaPublisherRepository();
  const publisher = await repository.create({ tenantId, schoolId, name: data.name, createdBy: actingUserId });
  return toDTO(publisher);
}

export async function updatePublisher(id: string, input: unknown, context: LibraryContext): Promise<PublisherDTO> {
  const parsed = updatePublisherSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid publisher data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaPublisherRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new PublisherNotFoundError();

  const publisher = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
  return toDTO(publisher);
}

export async function deletePublisher(id: string, context: LibraryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaPublisherRepository();
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new PublisherNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listPublishers(context: { tenantId: string }, filter?: { isActive?: boolean }): Promise<PublisherDTO[]> {
  const repository = new PrismaPublisherRepository();
  const publishers = await repository.findMany(context.tenantId, filter);
  return publishers.map(toDTO);
}

export { toDTO as toPublisherDTO };
