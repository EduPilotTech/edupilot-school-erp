import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { RouteFeeRule as PrismaRouteFeeRule } from "@/lib/generated/prisma/client";
import type {
  CreateRouteFeeRuleInput,
  RouteFeeRuleRepository,
  UpdateRouteFeeRuleInput,
} from "../domain/route-fee-rule.repository";
import type { RouteFeeRuleEntity } from "../domain/route-fee-rule.entity";

function toEntity(row: PrismaRouteFeeRule): RouteFeeRuleEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    routeId: row.routeId,
    academicSessionId: row.academicSessionId,
    feeCategoryId: row.feeCategoryId,
    amount: row.amount.toNumber(),
    frequency: row.frequency,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaRouteFeeRuleRepository implements RouteFeeRuleRepository {
  async findById(tenantId: string, id: string): Promise<RouteFeeRuleEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.routeFeeRule.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByRoute(tenantId: string, routeId: string, academicSessionId: string): Promise<RouteFeeRuleEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.routeFeeRule.findMany({ where: { tenantId, routeId, academicSessionId, deletedAt: null } })
    );
    return rows.map(toEntity);
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<RouteFeeRuleEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.routeFeeRule.findMany({ where: { tenantId, academicSessionId, deletedAt: null } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateRouteFeeRuleInput): Promise<RouteFeeRuleEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.routeFeeRule.create({
        data: {
          tenantId: input.tenantId,
          routeId: input.routeId,
          academicSessionId: input.academicSessionId,
          feeCategoryId: input.feeCategoryId,
          amount: input.amount,
          frequency: input.frequency,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateRouteFeeRuleInput): Promise<RouteFeeRuleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.routeFeeRule.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          amount: input.amount,
          frequency: input.frequency,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<RouteFeeRuleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.routeFeeRule.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
