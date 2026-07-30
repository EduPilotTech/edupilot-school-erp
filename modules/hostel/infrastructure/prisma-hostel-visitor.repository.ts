import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelVisitor as PrismaHostelVisitor } from "@/lib/generated/prisma/client";
import type { CreateHostelVisitorInput, HostelVisitorRepository } from "../domain/hostel-visitor.repository";
import type { HostelVisitorEntity } from "../domain/hostel-visitor.entity";

function toEntity(row: PrismaHostelVisitor): HostelVisitorEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    visitorName: row.visitorName,
    relation: row.relation,
    purpose: row.purpose,
    entryTime: row.entryTime,
    exitTime: row.exitTime,
    approvedBy: row.approvedBy,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export class PrismaHostelVisitorRepository implements HostelVisitorRepository {
  async findById(tenantId: string, id: string): Promise<HostelVisitorEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelVisitor.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByStudent(tenantId: string, studentId: string): Promise<HostelVisitorEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelVisitor.findMany({
        where: { tenantId, studentId },
        orderBy: { entryTime: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<HostelVisitorEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelVisitor.findMany({
        where: { tenantId, entryTime: { gte: startDate, lte: endDate } },
        orderBy: { entryTime: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelVisitorInput): Promise<HostelVisitorEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostelVisitor.create({
        data: {
          tenantId: input.tenantId,
          studentId: input.studentId,
          visitorName: input.visitorName,
          relation: input.relation,
          purpose: input.purpose,
          entryTime: input.entryTime,
          approvedBy: input.approvedBy ?? null,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async recordExit(tenantId: string, id: string, exitTime: Date): Promise<HostelVisitorEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelVisitor.update({
        where: { tenantId_id: { tenantId, id } },
        data: { exitTime },
      })
    );
    return toEntity(row);
  }
}
