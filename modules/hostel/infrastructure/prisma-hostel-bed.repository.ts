import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelBed as PrismaHostelBed, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateHostelBedInput,
  HostelBedRepository,
  UpdateHostelBedInput,
} from "../domain/hostel-bed.repository";
import type { BedStatusValue, HostelBedEntity } from "../domain/hostel-bed.entity";

function toEntity(row: PrismaHostelBed): HostelBedEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    roomId: row.roomId,
    bedNumber: row.bedNumber,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHostelBedRepository implements HostelBedRepository {
  async findById(tenantId: string, id: string): Promise<HostelBedEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelBed.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByRoom(tenantId: string, roomId: string): Promise<HostelBedEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelBed.findMany({
        where: { tenantId, roomId, deletedAt: null },
        orderBy: { bedNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findVacantByRoom(tenantId: string, roomId: string): Promise<HostelBedEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelBed.findMany({
        where: { tenantId, roomId, deletedAt: null, status: "AVAILABLE" },
        orderBy: { bedNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelBedInput): Promise<HostelBedEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostelBed.create({
        data: {
          tenantId: input.tenantId,
          roomId: input.roomId,
          bedNumber: input.bedNumber,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateHostelBedInput): Promise<HostelBedEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelBed.update({
        where: { tenantId_id: { tenantId, id } },
        data: { bedNumber: input.bedNumber, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async setStatus(
    tenantId: string,
    id: string,
    status: BedStatusValue,
    tx?: Prisma.TransactionClient
  ): Promise<HostelBedEntity> {
    const row = await withTenantContext(
      tenantId,
      (client) =>
        client.hostelBed.update({
          where: { tenantId_id: { tenantId, id } },
          data: { status },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelBedEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelBed.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), status: "BLOCKED", updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
