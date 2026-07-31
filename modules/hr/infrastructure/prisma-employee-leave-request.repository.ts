import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { EmployeeLeaveRequest as PrismaEmployeeLeaveRequest, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateEmployeeLeaveRequestInput,
  DecideEmployeeLeaveRequestInput,
  EmployeeLeaveRequestFilter,
  EmployeeLeaveRequestRepository,
} from "../domain/employee-leave-request.repository";
import type { EmployeeLeaveRequestEntity, LeaveRequestStatusValue } from "../domain/employee-leave-request.entity";

function toEntity(row: PrismaEmployeeLeaveRequest): EmployeeLeaveRequestEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    fromDate: row.fromDate,
    toDate: row.toDate,
    isHalfDay: row.isHalfDay,
    totalDays: row.totalDays.toNumber(),
    reason: row.reason,
    status: row.status as LeaveRequestStatusValue,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaEmployeeLeaveRequestRepository implements EmployeeLeaveRequestRepository {
  async findById(tenantId: string, id: string): Promise<EmployeeLeaveRequestEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.employeeLeaveRequest.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: EmployeeLeaveRequestFilter): Promise<EmployeeLeaveRequestEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.employeeLeaveRequest.findMany({
        where: {
          tenantId,
          employeeId: filter.employeeId,
          status: filter.status,
          fromDate: filter.fromDate ? { gte: filter.fromDate } : undefined,
          toDate: filter.toDate ? { lte: filter.toDate } : undefined,
        },
        orderBy: { createdAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateEmployeeLeaveRequestInput, tx?: Prisma.TransactionClient): Promise<EmployeeLeaveRequestEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.employeeLeaveRequest.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            leaveTypeId: input.leaveTypeId,
            fromDate: input.fromDate,
            toDate: input.toDate,
            isHalfDay: input.isHalfDay,
            totalDays: input.totalDays,
            reason: input.reason,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async decide(
    tenantId: string,
    id: string,
    input: DecideEmployeeLeaveRequestInput,
    tx?: Prisma.TransactionClient
  ): Promise<EmployeeLeaveRequestEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employeeLeaveRequest.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            status: input.status,
            approvedBy: input.approvedBy,
            approvedAt: input.approvedAt,
            rejectionReason: input.rejectionReason ?? null,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async cancel(tenantId: string, id: string, updatedBy: string | null, tx?: Prisma.TransactionClient): Promise<EmployeeLeaveRequestEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.employeeLeaveRequest.update({
          where: { tenantId_id: { tenantId, id } },
          data: { status: "CANCELLED", updatedBy },
        }),
      tx
    );
    return toEntity(row);
  }
}
