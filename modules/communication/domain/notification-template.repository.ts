import type { Prisma } from "@/lib/generated/prisma/client";
import type { NotificationChannelValue } from "./notification-delivery.entity";
import type { NotificationTemplateEntity } from "./notification-template.entity";

export interface CreateNotificationTemplateInput {
  tenantId: string;
  name: string;
  channel: NotificationChannelValue;
  subject?: string | null;
  message: string;
  variables?: string[];
  createdBy?: string | null;
}

export interface UpdateNotificationTemplateInput {
  subject?: string | null;
  message?: string;
  variables?: string[];
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface NotificationTemplateFilter {
  channel?: NotificationChannelValue;
  isActive?: boolean;
}

export interface NotificationTemplateRepository {
  findById(tenantId: string, id: string): Promise<NotificationTemplateEntity | null>;
  findByNameAndChannel(
    tenantId: string,
    name: string,
    channel: NotificationChannelValue
  ): Promise<NotificationTemplateEntity | null>;
  findMany(tenantId: string, filter?: NotificationTemplateFilter): Promise<NotificationTemplateEntity[]>;

  create(input: CreateNotificationTemplateInput, tx?: Prisma.TransactionClient): Promise<NotificationTemplateEntity>;
  update(
    tenantId: string,
    id: string,
    input: UpdateNotificationTemplateInput,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationTemplateEntity>;
  softDelete(
    tenantId: string,
    id: string,
    deletedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<NotificationTemplateEntity>;
}
