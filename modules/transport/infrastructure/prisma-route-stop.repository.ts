import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, RouteStop as PrismaRouteStop } from "@/lib/generated/prisma/client";
import type {
  CreateRouteStopInput,
  RouteStopRepository,
  UpdateRouteStopInput,
} from "../domain/route-stop.repository";
import type { RouteStopEntity } from "../domain/route-stop.entity";

// Prisma maps @db.Time to a JS Date with an arbitrary epoch date part — only the time-of-day
// component is meaningful. Converted to/from a plain "HH:mm" string at this infrastructure
// boundary so the domain layer never has to reason about the bogus date part.
function toTimeString(value: Date | null): string | null {
  if (!value) return null;
  return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
}

function fromTimeString(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

function toEntity(row: PrismaRouteStop): RouteStopEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    routeId: row.routeId,
    name: row.name,
    sequenceOrder: row.sequenceOrder,
    pickupTime: toTimeString(row.pickupTime),
    dropTime: toTimeString(row.dropTime),
    landmark: row.landmark,
    latitude: row.latitude ? row.latitude.toNumber() : null,
    longitude: row.longitude ? row.longitude.toNumber() : null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaRouteStopRepository implements RouteStopRepository {
  async findById(tenantId: string, id: string): Promise<RouteStopEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.routeStop.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByRoute(tenantId: string, routeId: string): Promise<RouteStopEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.routeStop.findMany({
        where: { tenantId, routeId, deletedAt: null },
        orderBy: { sequenceOrder: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateRouteStopInput, tx?: Prisma.TransactionClient): Promise<RouteStopEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (client) =>
        client.routeStop.create({
          data: {
            tenantId: input.tenantId,
            routeId: input.routeId,
            name: input.name,
            sequenceOrder: input.sequenceOrder,
            pickupTime: fromTimeString(input.pickupTime) ?? null,
            dropTime: fromTimeString(input.dropTime) ?? null,
            landmark: input.landmark ?? null,
            createdBy: input.createdBy ?? null,
            updatedBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateRouteStopInput): Promise<RouteStopEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.routeStop.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          sequenceOrder: input.sequenceOrder,
          pickupTime: fromTimeString(input.pickupTime),
          dropTime: fromTimeString(input.dropTime),
          landmark: input.landmark,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<RouteStopEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.routeStop.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
