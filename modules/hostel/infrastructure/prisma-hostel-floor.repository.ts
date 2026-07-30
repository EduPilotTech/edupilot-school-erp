import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelFloor as PrismaHostelFloor } from "@/lib/generated/prisma/client";
import type {
  CreateHostelFloorInput,
  HostelFloorRepository,
  UpdateHostelFloorInput,
} from "../domain/hostel-floor.repository";
import type { HostelFloorEntity } from "../domain/hostel-floor.entity";

function toEntity(row: PrismaHostelFloor): HostelFloorEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    buildingId: row.buildingId,
    name: row.name,
    floorNumber: row.floorNumber,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHostelFloorRepository implements HostelFloorRepository {
  async findById(tenantId: string, id: string): Promise<HostelFloorEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelFloor.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByBuilding(tenantId: string, buildingId: string): Promise<HostelFloorEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelFloor.findMany({
        where: { tenantId, buildingId, deletedAt: null },
        orderBy: { floorNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelFloorInput): Promise<HostelFloorEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostelFloor.create({
        data: {
          tenantId: input.tenantId,
          buildingId: input.buildingId,
          name: input.name,
          floorNumber: input.floorNumber,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateHostelFloorInput): Promise<HostelFloorEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelFloor.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          floorNumber: input.floorNumber,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelFloorEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelFloor.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
