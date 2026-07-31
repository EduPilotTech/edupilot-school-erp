import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, PayrollAuditLog as PrismaPayrollAuditLog } from "@/lib/generated/prisma/client";
import type {
  CreatePayrollAuditLogInput,
  PayrollAuditLogFilter,
  PayrollAuditLogRepository,
} from "../domain/payroll-audit-log.repository";
import type { PayrollAuditLogEntity } from "../domain/payroll-audit-log.entity";

function toEntity(row: PrismaPayrollAuditLog): PayrollAuditLogEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    actorId: row.actorId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    beforeState: row.beforeState,
    afterState: row.afterState,
    createdAt: row.createdAt,
  };
}

export class PrismaPayrollAuditLogRepository implements PayrollAuditLogRepository {
  async findMany(tenantId: string, filter: PayrollAuditLogFilter): Promise<PayrollAuditLogEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.payrollAuditLog.findMany({
        where: { tenantId, entityType: filter.entityType, entityId: filter.entityId },
        orderBy: { createdAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreatePayrollAuditLogInput, tx?: Prisma.TransactionClient): Promise<PayrollAuditLogEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.payrollAuditLog.create({
          data: {
            tenantId: input.tenantId,
            actorId: input.actorId ?? null,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            beforeState: input.beforeState === undefined ? undefined : (input.beforeState as Prisma.InputJsonValue),
            afterState: input.afterState === undefined ? undefined : (input.afterState as Prisma.InputJsonValue),
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
