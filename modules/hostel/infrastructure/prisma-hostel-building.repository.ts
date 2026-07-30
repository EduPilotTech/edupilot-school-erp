import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { HostelBuilding as PrismaHostelBuilding } from "@/lib/generated/prisma/client";
import type {
  CreateHostelBuildingInput,
  HostelBuildingRepository,
  UpdateHostelBuildingInput,
} from "../domain/hostel-building.repository";
import type { HostelBuildingEntity } from "../domain/hostel-building.entity";

function toEntity(row: PrismaHostelBuilding): HostelBuildingEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    hostelId: row.hostelId,
    name: row.name,
    code: row.code,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaHostelBuildingRepository implements HostelBuildingRepository {
  async findById(tenantId: string, id: string): Promise<HostelBuildingEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelBuilding.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByHostel(tenantId: string, hostelId: string): Promise<HostelBuildingEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.hostelBuilding.findMany({
        where: { tenantId, hostelId, deletedAt: null },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateHostelBuildingInput): Promise<HostelBuildingEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.hostelBuilding.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateHostelBuildingInput): Promise<HostelBuildingEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelBuilding.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          code: input.code,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<HostelBuildingEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.hostelBuilding.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
