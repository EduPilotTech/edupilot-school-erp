import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaNotificationTemplateRepository } from "../infrastructure/prisma-notification-template.repository";
import { NotificationTemplateAlreadyExistsError, NotificationTemplateNotFoundError } from "../domain/errors";
import {
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  type NotificationTemplateDTO,
} from "./dto/notification-template.dto";
import type { NotificationTemplateEntity } from "../domain/notification-template.entity";
import type { NotificationChannelValue } from "../domain/notification-delivery.entity";
import type { NotificationContext } from "./notification-context";

const repository = new PrismaNotificationTemplateRepository();

function toDTO(entity: NotificationTemplateEntity): NotificationTemplateDTO {
  return {
    id: entity.id,
    name: entity.name,
    channel: entity.channel,
    subject: entity.subject,
    message: entity.message,
    variables: entity.variables,
    isActive: entity.isActive,
  };
}

// `(tenantId, name, channel)` uniqueness (see the model's own `@@unique([tenantId, name, channel])`)
// is enforced both here (pre-check, the common path) and via the P2002 catch below (the race-safe
// path) — the same double-guard shape as createFinanceAccount.
export async function createNotificationTemplate(
  input: unknown,
  context: NotificationContext
): Promise<NotificationTemplateDTO> {
  const parsed = createNotificationTemplateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid notification template data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const existing = await repository.findByNameAndChannel(tenantId, data.name, data.channel);
  if (existing && existing.deletedAt === null) {
    throw new NotificationTemplateAlreadyExistsError();
  }

  try {
    const template = await repository.create({
      tenantId,
      name: data.name,
      channel: data.channel,
      subject: data.subject ?? null,
      message: data.message,
      variables: data.variables ?? [],
      createdBy: actingUserId,
    });
    return toDTO(template);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new NotificationTemplateAlreadyExistsError();
    }
    throw error;
  }
}

export async function updateNotificationTemplate(
  id: string,
  input: unknown,
  context: NotificationContext
): Promise<NotificationTemplateDTO> {
  const parsed = updateNotificationTemplateSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid notification template data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new NotificationTemplateNotFoundError();

  const template = await repository.update(tenantId, id, { ...data, updatedBy: actingUserId });
  return toDTO(template);
}

export async function softDeleteNotificationTemplate(id: string, context: NotificationContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const existing = await repository.findById(tenantId, id);
  if (!existing || existing.deletedAt !== null) throw new NotificationTemplateNotFoundError();
  await repository.softDelete(tenantId, id, actingUserId);
}

export async function listNotificationTemplates(
  tenantId: string,
  filter?: { channel?: NotificationChannelValue; isActive?: boolean }
): Promise<NotificationTemplateDTO[]> {
  const templates = await repository.findMany(tenantId, filter);
  return templates.map(toDTO);
}

export async function getNotificationTemplate(tenantId: string, id: string): Promise<NotificationTemplateDTO> {
  const template = await repository.findById(tenantId, id);
  if (!template || template.deletedAt !== null) throw new NotificationTemplateNotFoundError();
  return toDTO(template);
}

export { toDTO as toNotificationTemplateDTO };
