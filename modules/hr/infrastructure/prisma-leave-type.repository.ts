import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { LeaveType as PrismaLeaveType, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateLeaveTypeInput,
  LeaveTypeRepository,
  UpdateLeaveTypeInput,
} from "../domain/leave-type.repository";
import type { LeaveTypeEntity } from "../domain/leave-type.entity";

function toEntity(row: PrismaLeaveType): LeaveTypeEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    code: row.code,
    maxDaysPerYear: row.maxDaysPerYear,
    carryForwardAllowed: row.carryForwardAllowed,
    carryForwardMaxDays: row.carryForwardMaxDays,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaLeaveTypeRepository implements LeaveTypeRepository {
  async findById(tenantId: string, id: string): Promise<LeaveTypeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.leaveType.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<LeaveTypeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.leaveType.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<LeaveTypeEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.leaveType.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateLeaveTypeInput, tx?: Prisma.TransactionClient): Promise<LeaveTypeEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.leaveType.create({
          data: {
            tenantId: input.tenantId,
            schoolId: input.schoolId,
            name: input.name,
            code: input.code,
            maxDaysPerYear: input.maxDaysPerYear,
            carryForwardAllowed: input.carryForwardAllowed ?? false,
            carryForwardMaxDays: input.carryForwardMaxDays ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateLeaveTypeInput, tx?: Prisma.TransactionClient): Promise<LeaveTypeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.leaveType.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            name: input.name,
            code: input.code,
            maxDaysPerYear: input.maxDaysPerYear,
            carryForwardAllowed: input.carryForwardAllowed,
            carryForwardMaxDays: input.carryForwardMaxDays,
            isActive: input.isActive,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null, tx?: Prisma.TransactionClient): Promise<LeaveTypeEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.leaveType.update({
          where: { tenantId_id: { tenantId, id } },
          data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
