import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaParentActivityLogRepository } from "../infrastructure/prisma-parent-activity-log.repository";

export interface RecordParentActivityInput {
  tenantId: string;
  guardianId: string;
  userProfileId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
}

const activityLogRepository = new PrismaParentActivityLogRepository();

// Called explicitly by meaningful actions (report card viewed, receipt downloaded, message sent,
// login) — not embedded inside every read service, which would spam the log with noise. Unifies
// Parent Activity Log (requirement 21) and the messaging audit-log requirement (17) — see
// ParentActivityLogEntity's own comment.
export async function recordParentActivity(
  input: RecordParentActivityInput,
  tx?: Prisma.TransactionClient
): Promise<void> {
  await activityLogRepository.create(
    {
      tenantId: input.tenantId,
      guardianId: input.guardianId,
      userProfileId: input.userProfileId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ipAddress: input.ipAddress,
    },
    tx
  );
}
