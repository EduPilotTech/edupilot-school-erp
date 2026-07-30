import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelLeaveRequest as PrismaHostelLeaveRequest } from "@/lib/generated/prisma/client";
import type {
  CreateHostelLeaveRequestInput,
  DecideHostelLeaveRequestInput,
  HostelLeaveRequestRepository,
} from "../domain/hostel-leave-request.repository";
import type { HostelLeaveRequestEntity, HostelLeaveStatusValue } from "../domain/hostel-leave-request.entity";

function toEntity(row: PrismaHostelLeaveRequest): HostelLeaveRequestEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    studentHostelAssignmentId: row.studentHostelAssignmentId,
    leaveType: row.leaveType,
    fromDate: row.fromDate,
    toDate: row.toDate,
    reason: row.reason,
    status: row.status,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    rejectionReason: row.rejectionReason,
    actualReturnDate: row.actualReturnDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHostelLeaveRequestRepository implements HostelLeaveRequestRepository {
  async findById(tenantId: string, id: string): Promise<HostelLeaveRequestEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelLeaveRequest.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByStudent(tenantId: string, studentId: string): Promise<HostelLeaveRequestEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelLeaveRequest.findMany({
        where: { tenantId, studentId },
        orderBy: { createdAt: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByStatus(tenantId: string, status: HostelLeaveStatusValue): Promise<HostelLeaveRequestEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelLeaveRequest.findMany({
        where: { tenantId, status },
        orderBy: { fromDate: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelLeaveRequestInput): Promise<HostelLeaveRequestEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostelLeaveRequest.create({
        data: {
          tenantId: input.tenantId,
          studentId: input.studentId,
          studentHostelAssignmentId: input.studentHostelAssignmentId,
          leaveType: input.leaveType,
          fromDate: input.fromDate,
          toDate: input.toDate,
          reason: input.reason,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async decide(
    tenantId: string,
    id: string,
    input: DecideHostelLeaveRequestInput
  ): Promise<HostelLeaveRequestEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelLeaveRequest.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          status: input.status,
          approvedBy: input.approvedBy,
          approvedAt: input.approvedAt,
          rejectionReason: input.rejectionReason ?? null,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async recordReturn(
    tenantId: string,
    id: string,
    actualReturnDate: Date,
    updatedBy: string | null
  ): Promise<HostelLeaveRequestEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelLeaveRequest.update({
        where: { tenantId_id: { tenantId, id } },
        data: { actualReturnDate, updatedBy },
      })
    );
    return toEntity(row);
  }

  async cancel(tenantId: string, id: string, updatedBy: string | null): Promise<HostelLeaveRequestEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelLeaveRequest.update({
        where: { tenantId_id: { tenantId, id } },
        data: { status: "CANCELLED", updatedBy },
      })
    );
    return toEntity(row);
  }
}
