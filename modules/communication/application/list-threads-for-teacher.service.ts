import "server-only";
import { PrismaMessageThreadRepository } from "../infrastructure/prisma-message-thread.repository";
import type { MessageThreadEntity } from "../domain/message-thread.entity";

export async function listThreadsForTeacher(tenantId: string, teacherId: string): Promise<MessageThreadEntity[]> {
  const repository = new PrismaMessageThreadRepository();
  return repository.findByTeacher(tenantId, teacherId);
}
