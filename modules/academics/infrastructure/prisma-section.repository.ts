import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Section as PrismaSection } from "@/lib/generated/prisma/client";
import type {
  CreateSectionInput,
  SectionListFilter,
  SectionListResult,
  SectionRepository,
  UpdateSectionInput,
} from "../domain/section.repository";
import type { SectionEntity } from "../domain/section.entity";

function toEntity(row: PrismaSection): SectionEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    classId: row.classId,
    name: row.name,
    capacity: row.capacity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaSectionRepository implements SectionRepository {
  async findById(tenantId: string, id: string): Promise<SectionEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.section.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: SectionListFilter): Promise<SectionListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where = {
        tenantId,
        deletedAt: null,
        ...(filter.classId ? { classId: filter.classId } : {}),
      };

      const [rows, total] = await Promise.all([
        tx.section.findMany({
          where,
          orderBy: { name: "asc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.section.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async create(input: CreateSectionInput): Promise<SectionEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.section.create({
        data: {
          tenantId: input.tenantId,
          classId: input.classId,
          name: input.name,
          capacity: input.capacity ?? null,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateSectionInput): Promise<SectionEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.section.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, capacity: input.capacity, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<SectionEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.section.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async restore(tenantId: string, id: string, updatedBy: string | null): Promise<SectionEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.section.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, updatedBy },
      })
    );
    return toEntity(row);
  }
}
