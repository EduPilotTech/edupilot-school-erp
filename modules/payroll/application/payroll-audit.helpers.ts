import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PrismaPayrollAuditLogRepository } from "../infrastructure/prisma-payroll-audit-log.repository";
import type { PayrollAuditLogEntity } from "../domain/payroll-audit-log.entity";

export interface RecordPayrollAuditInput {
  tenantId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
}

const auditLogRepository = new PrismaPayrollAuditLogRepository();

// Thin wrapper so every mutating payroll service writes its audit row the same way, exactly
// mirroring modules/fees/application/fee-audit.helpers.ts's `recordFeeAudit`. Pass `tx` to make
// the audit write part of the same transaction as the mutation it records.
export async function recordPayrollAudit(input: RecordPayrollAuditInput, tx?: Prisma.TransactionClient): Promise<void> {
  await auditLogRepository.create(
    {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeState: input.beforeState,
      afterState: input.afterState,
    },
    tx
  );
}

export async function listPayrollAuditLog(
  tenantId: string,
  filter: { entityType?: string; entityId?: string }
): Promise<PayrollAuditLogEntity[]> {
  return auditLogRepository.findMany(tenantId, filter);
}
