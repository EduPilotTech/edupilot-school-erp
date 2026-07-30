import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelWing as PrismaHostelWing } from "@/lib/generated/prisma/client";
import type {
  CreateHostelWingInput,
  HostelWingRepository,
  UpdateHostelWingInput,
} from "../domain/hostel-wing.repository";
import type { HostelWingEntity } from "../domain/hostel-wing.entity";

function toEntity(row: PrismaHostelWing): HostelWingEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    buildingId: row.buildingId,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHostelWingRepository implements HostelWingRepository {
  async findById(tenantId: string, id: string): Promise<HostelWingEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelWing.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByBuilding(tenantId: string, buildingId: string): Promise<HostelWingEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelWing.findMany({
        where: { tenantId, buildingId, deletedAt: null },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelWingInput): Promise<HostelWingEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostelWing.create({
        data: {
          tenantId: input.tenantId,
          buildingId: input.buildingId,
          name: input.name,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateHostelWingInput): Promise<HostelWingEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelWing.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelWingEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelWing.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
