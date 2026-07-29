import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Message as PrismaMessage } from "@/lib/generated/prisma/client";
import type { CreateMessageInput, MessageRepository } from "../domain/message.repository";
import type { MessageEntity, MessageSenderRoleValue } from "../domain/message.entity";

function toEntity(row: PrismaMessage): MessageEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    threadId: row.threadId,
    senderUserProfileId: row.senderUserProfileId,
    senderRole: row.senderRole as MessageSenderRoleValue,
    body: row.body,
    sentAt: row.sentAt,
    readAt: row.readAt,
  };
}

export class PrismaMessageRepository implements MessageRepository {
  async findByThread(tenantId: string, threadId: string): Promise<MessageEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.message.findMany({ where: { tenantId, threadId }, orderBy: { sentAt: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateMessageInput, tx?: Prisma.TransactionClient): Promise<MessageEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.message.create({
          data: {
            tenantId: input.tenantId,
            threadId: input.threadId,
            senderUserProfileId: input.senderUserProfileId,
            senderRole: input.senderRole,
            body: input.body,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async markThreadAsRead(
    tenantId: string,
    threadId: string,
    readerUserProfileId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const result = await withTenantContext(
      tenantId,
      (client) =>
        client.message.updateMany({
          where: {
            tenantId,
            threadId,
            senderUserProfileId: { not: readerUserProfileId },
            readAt: null,
          },
          data: { readAt: new Date() },
        }),
      tx
    );
    return result.count;
  }
}
