import type { Prisma } from "@/lib/generated/prisma/client";
import type { FeeAuditLogEntity } from "./fee-audit-log.entity";

export interface CreateFeeAuditLogInput {
  tenantId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
}

// Fee-module-scoped audit trail (Phase 8 Decision 6). `create` accepts an optional `tx` so a
// mutating fee service can write its audit row inside the same transaction as the financial
// mutation itself — a deliberate, narrower deviation from docs/SECURITY_GUIDELINES.md §7's
// general "audit failures never block the primary operation" rule, justified specifically for
// financial writes (an invoice/payment mutation with a silently-missing audit row is itself a
// compliance gap this module exists to prevent). Every other module's audit logging, if/when
// built, is free to keep the non-blocking, best-effort shape §7 describes.
export interface FeeAuditLogRepository {
  findByEntity(tenantId: string, entityType: string, entityId: string): Promise<FeeAuditLogEntity[]>;
  create(input: CreateFeeAuditLogInput, tx?: Prisma.TransactionClient): Promise<FeeAuditLogEntity>;
}
