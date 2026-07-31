import type { Prisma } from "@/lib/generated/prisma/client";
import type { PayrollAuditLogEntity } from "./payroll-audit-log.entity";

export interface CreatePayrollAuditLogInput {
  tenantId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
}

export interface PayrollAuditLogFilter {
  entityType?: string;
  entityId?: string;
}

// Mirrors FeeAuditLogRepository exactly — `create` accepts an optional `tx` so a mutating payroll
// service can write its audit row inside the same transaction as the financial mutation itself.
export interface PayrollAuditLogRepository {
  findMany(tenantId: string, filter: PayrollAuditLogFilter): Promise<PayrollAuditLogEntity[]>;
  create(input: CreatePayrollAuditLogInput, tx?: Prisma.TransactionClient): Promise<PayrollAuditLogEntity>;
}
