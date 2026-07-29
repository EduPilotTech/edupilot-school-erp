import type { Prisma } from "@/lib/generated/prisma/client";
import type { ParentActivityLogEntity } from "./parent-activity-log.entity";

export interface CreateParentActivityLogInput {
  tenantId: string;
  guardianId: string;
  userProfileId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
}

// Append-only — no update or delete method, the same structural discipline as
// FeeLedgerEntryRepository/EnrollmentRepository: "never rewrite log history" is enforced by what
// this interface makes possible to call, not just documented.
export interface ParentActivityLogRepository {
  findByGuardian(tenantId: string, guardianId: string, limit?: number): Promise<ParentActivityLogEntity[]>;
  create(input: CreateParentActivityLogInput, tx?: Prisma.TransactionClient): Promise<ParentActivityLogEntity>;
}
