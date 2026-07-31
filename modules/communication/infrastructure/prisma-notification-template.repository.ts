import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { NotificationTemplate as PrismaNotificationTemplate, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateNotificationTemplateInput,
  NotificationTemplateFilter,
  NotificationTemplateRepository,
  UpdateNotificationTemplateInput,
} from "../domain/notification-template.repository";
import type { NotificationTemplateEntity } from "../domain/notification-template.entity";
import type { NotificationChannelValue } from "../domain/notification-delivery.entity";

// `variables` is stored as `Json` (default `[]`) — parsed to a plain `string[]` here at the
// Prisma boundary, per docs/CODING_STANDARDS.md's "domain layer has zero imports from Prisma"
// rule. Anything that isn't an array of strings (should never happen given this repository is the
// only writer) degrades to `[]` rather than throwing.
function toVariables(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toEntity(row: PrismaNotificationTemplate): NotificationTemplateEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    channel: row.channel as NotificationChannelValue,
    subject: row.subject,
    message: row.message,
    variables: toVariables(row.variables),
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaNotificationTemplateRepository implements NotificationTemplateRepository {
  async findById(tenantId: string, id: string): Promise<NotificationTemplateEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.notificationTemplate.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByNameAndChannel(
    tenantId: string,
    name: string,
    channel: NotificationChannelValue
  ): Promise<NotificationTemplateEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.notificationTemplate.findUnique({ where: { tenantId_name_channel: { tenantId, name, channel } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: NotificationTemplateFilter): Promise<NotificationTemplateEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.notificationTemplate.findMany({
        where: {
          tenantId,
          deletedAt: null,
          channel: filter?.channel,
          isActive: filter?.isActive,
        },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(
    input: CreateNotificationTemplateInput,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationTemplateEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.notificationTemplate.create({
          data: {
            tenantId: input.tenantId,
            name: input.name,
            channel: input.channel,
            subject: input.subject ?? null,
            message: input.message,
            variables: input.variables ?? [],
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateNotificationTemplateInput,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationTemplateEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.notificationTemplate.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            subject: input.subject,
            message: input.message,
            variables: input.variables,
            isActive: input.isActive,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(
    tenantId: string,
    id: string,
    deletedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationTemplateEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.notificationTemplate.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
