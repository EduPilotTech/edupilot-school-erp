import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Route as PrismaRoute } from "@/lib/generated/prisma/client";
import type { CreateRouteInput, RouteRepository, UpdateRouteInput } from "../domain/route.repository";
import type { RouteEntity } from "../domain/route.entity";

function toEntity(row: PrismaRoute): RouteEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    code: row.code,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaRouteRepository implements RouteRepository {
  async findById(tenantId: string, id: string): Promise<RouteEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.route.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<RouteEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.route.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<RouteEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.route.findMany({
        where: { tenantId, deletedAt: null, isActive: filter?.isActive },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateRouteInput): Promise<RouteEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.route.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          code: input.code,
          description: input.description ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateRouteInput): Promise<RouteEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.route.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          code: input.code,
          description: input.description,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<RouteEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.route.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
