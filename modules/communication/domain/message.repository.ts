import type { Prisma } from "@/lib/generated/prisma/client";
import type { MessageEntity, MessageSenderRoleValue } from "./message.entity";

export interface CreateMessageInput {
  tenantId: string;
  threadId: string;
  senderUserProfileId: string;
  senderRole: MessageSenderRoleValue;
  body: string;
}

export interface MessageRepository {
  findByThread(tenantId: string, threadId: string): Promise<MessageEntity[]>;

  create(input: CreateMessageInput, tx?: Prisma.TransactionClient): Promise<MessageEntity>;

  // Marks every message in the thread NOT sent by `readerUserProfileId` as read — "I opened this
  // thread" reads everything sent to me, not the messages I sent myself.
  markThreadAsRead(
    tenantId: string,
    threadId: string,
    readerUserProfileId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number>;
}
