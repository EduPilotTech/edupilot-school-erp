import "server-only";
import { UnauthorizedError } from "@/lib/errors";
import { PrismaGuardianRepository } from "@/modules/students/infrastructure/prisma-guardian.repository";
import { PrismaTeacherRepository } from "@/modules/teachers/infrastructure/prisma-teacher.repository";
import { PrismaMessageThreadRepository } from "../infrastructure/prisma-message-thread.repository";
import { PrismaMessageRepository } from "../infrastructure/prisma-message.repository";
import { MessageThreadNotFoundError } from "../domain/errors";
import type { MessageDTO, MessageThreadDTO } from "./dto/message.dto";

// Shared by both the parent-facing and teacher-facing thread views. Defense-in-depth: confirms
// `readerUserProfileId` is actually a participant in this thread (the guardian or the teacher)
// before returning anything — a thread id alone must not be enough to read someone else's
// messages, matching docs/SECURITY_GUIDELINES.md §1's three-independent-layers model.
export async function getThreadMessages(
  tenantId: string,
  threadId: string,
  readerUserProfileId: string
): Promise<MessageThreadDTO> {
  const threadRepository = new PrismaMessageThreadRepository();
  const thread = await threadRepository.findById(tenantId, threadId);
  if (!thread) {
    throw new MessageThreadNotFoundError();
  }

  const guardianRepository = new PrismaGuardianRepository();
  const teacherRepository = new PrismaTeacherRepository();
  const [guardian, teacher] = await Promise.all([
    guardianRepository.findById(tenantId, thread.guardianId),
    teacherRepository.findById(tenantId, thread.teacherId),
  ]);

  const isParticipant =
    guardian?.userProfileId === readerUserProfileId || teacher?.userProfileId === readerUserProfileId;
  if (!isParticipant) {
    throw new UnauthorizedError("You are not a participant in this conversation.");
  }

  const messageRepository = new PrismaMessageRepository();
  await messageRepository.markThreadAsRead(tenantId, threadId, readerUserProfileId);
  const messages = await messageRepository.findByThread(tenantId, threadId);

  const messageDTOs: MessageDTO[] = messages.map((message) => ({
    id: message.id,
    threadId: message.threadId,
    senderUserProfileId: message.senderUserProfileId,
    senderRole: message.senderRole,
    body: message.body,
    sentAt: message.sentAt.toISOString(),
    readAt: message.readAt ? message.readAt.toISOString() : null,
  }));

  return {
    id: thread.id,
    studentId: thread.studentId,
    guardianId: thread.guardianId,
    teacherId: thread.teacherId,
    subject: thread.subject,
    isActive: thread.isActive,
    messages: messageDTOs,
  };
}
