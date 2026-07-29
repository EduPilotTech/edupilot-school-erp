import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { PrismaMessageThreadRepository } from "../infrastructure/prisma-message-thread.repository";
import { PrismaMessageRepository } from "../infrastructure/prisma-message.repository";
import { dispatchNotification } from "./dispatch-notification.helpers";
import type { MessageSenderRoleValue } from "../domain/message.entity";
import type { MessageDTO } from "./dto/message.dto";

export interface PostMessageInput {
  tenantId: string;
  studentId: string;
  guardianId: string;
  teacherId: string;
  senderUserProfileId: string;
  senderRole: MessageSenderRoleValue;
  recipientUserProfileId: string;
  body: string;
  subject?: string | null;
}

const MESSAGE_PREVIEW_LENGTH = 140;

// The shared core of Parent <-> Teacher Messaging (requirement 17) — find-or-create the
// (student, guardian, teacher) thread, append the message, and dispatch a Notification to the
// other party, all in one transaction. Used by both sendMessageAsParent and sendMessageAsTeacher
// so the atomicity and notification behavior can never drift between the two directions.
export async function postMessage(input: PostMessageInput): Promise<MessageDTO> {
  const threadRepository = new PrismaMessageThreadRepository();
  const messageRepository = new PrismaMessageRepository();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${input.tenantId}, true)`;

    let thread = await threadRepository.findByTriple(input.tenantId, input.studentId, input.guardianId, input.teacherId);
    if (!thread) {
      try {
        thread = await threadRepository.create(
          {
            tenantId: input.tenantId,
            studentId: input.studentId,
            guardianId: input.guardianId,
            teacherId: input.teacherId,
            subject: input.subject ?? null,
          },
          tx
        );
      } catch (error) {
        // A concurrent first message on the same triple already created it — fall back to the
        // now-existing row rather than failing (mirrors the pre-check + P2002 fallback pattern
        // used throughout this codebase, e.g. create-exam-type.service.ts).
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          thread = await threadRepository.findByTriple(input.tenantId, input.studentId, input.guardianId, input.teacherId);
        }
        if (!thread) throw error;
      }
    }

    const message = await messageRepository.create(
      {
        tenantId: input.tenantId,
        threadId: thread.id,
        senderUserProfileId: input.senderUserProfileId,
        senderRole: input.senderRole,
        body: input.body,
      },
      tx
    );

    const preview =
      input.body.length > MESSAGE_PREVIEW_LENGTH ? `${input.body.slice(0, MESSAGE_PREVIEW_LENGTH)}…` : input.body;

    await dispatchNotification(
      {
        tenantId: input.tenantId,
        recipientUserProfileId: input.recipientUserProfileId,
        type: "MESSAGE",
        priority: "NORMAL",
        title: "New message",
        body: preview,
        referenceType: "MessageThread",
        referenceId: thread.id,
      },
      tx
    );

    return {
      id: message.id,
      threadId: message.threadId,
      senderUserProfileId: message.senderUserProfileId,
      senderRole: message.senderRole,
      body: message.body,
      sentAt: message.sentAt.toISOString(),
      readAt: message.readAt ? message.readAt.toISOString() : null,
    };
  });
}
