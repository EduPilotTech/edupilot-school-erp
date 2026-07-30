import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelFeeRule as PrismaHostelFeeRule } from "@/lib/generated/prisma/client";
import type {
  CreateHostelFeeRuleInput,
  HostelFeeRuleRepository,
  UpdateHostelFeeRuleInput,
} from "../domain/hostel-fee-rule.repository";
import type { HostelFeeRuleEntity } from "../domain/hostel-fee-rule.entity";

function toEntity(row: PrismaHostelFeeRule): HostelFeeRuleEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    hostelId: row.hostelId,
    roomType: row.roomType,
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

export class PrismaHostelFeeRuleRepository implements HostelFeeRuleRepository {
  async findById(tenantId: string, id: string): Promise<HostelFeeRuleEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelFeeRule.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByHostel(tenantId: string, hostelId: string, academicSessionId: string): Promise<HostelFeeRuleEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelFeeRule.findMany({ where: { tenantId, hostelId, academicSessionId, deletedAt: null } })
    );
    return rows.map(toEntity);
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<HostelFeeRuleEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelFeeRule.findMany({ where: { tenantId, academicSessionId, deletedAt: null } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelFeeRuleInput): Promise<HostelFeeRuleEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostelFeeRule.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          roomType: input.roomType,
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

  async update(tenantId: string, id: string, input: UpdateHostelFeeRuleInput): Promise<HostelFeeRuleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelFeeRule.update({
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

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelFeeRuleEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelFeeRule.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
