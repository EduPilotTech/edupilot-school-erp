import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Publisher as PrismaPublisher } from "@/lib/generated/prisma/client";
import type { CreatePublisherInput, PublisherRepository, UpdatePublisherInput } from "../domain/publisher.repository";
import type { PublisherEntity } from "../domain/publisher.entity";

function toEntity(row: PrismaPublisher): PublisherEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaPublisherRepository implements PublisherRepository {
  async findById(tenantId: string, id: string): Promise<PublisherEntity | null> {
    const row = await withTenantContext(tenantId, (tx) => tx.publisher.findUnique({ where: { tenantId_id: { tenantId, id } } }));
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<PublisherEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.publisher.findMany({ where: { tenantId, deletedAt: null, isActive: filter?.isActive }, orderBy: { name: "asc" } })
    );
    return rows.map(toEntity);
  }

  async create(input: CreatePublisherInput): Promise<PublisherEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.publisher.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdatePublisherInput): Promise<PublisherEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.publisher.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, isActive: input.isActive, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<PublisherEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.publisher.update({ where: { tenantId_id: { tenantId, id } }, data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy } })
    );
    return toEntity(row);
  }
}
