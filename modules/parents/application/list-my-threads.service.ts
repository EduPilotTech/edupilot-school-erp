import "server-only";
import { PrismaMessageThreadRepository } from "@/modules/communication/infrastructure/prisma-message-thread.repository";
import { resolveGuardianForUserProfile } from "./guardian-access.helpers";
import type { MessageThreadEntity } from "@/modules/communication/domain/message-thread.entity";

export interface ListMyThreadsContext {
  tenantId: string;
  userProfileId: string;
}

export async function listMyThreads(context: ListMyThreadsContext): Promise<MessageThreadEntity[]> {
  const guardian = await resolveGuardianForUserProfile(context.tenantId, context.userProfileId);
  const repository = new PrismaMessageThreadRepository();
  return repository.findByGuardian(context.tenantId, guardian.id);
}
