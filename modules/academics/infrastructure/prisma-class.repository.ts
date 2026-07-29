import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Class as PrismaClass } from "@/lib/generated/prisma/client";
import type {
  ClassListFilter,
  ClassListResult,
  ClassRepository,
  CreateClassInput,
  UpdateClassInput,
} from "../domain/class.repository";
import type { ClassEntity } from "../domain/class.entity";

function toEntity(row: PrismaClass): ClassEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    academicSessionId: row.academicSessionId,
    name: row.name,
    grade: row.grade,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// Every tenant-scoped lookup/write uses the `tenantId_id` compound unique (from
// `@@unique([tenantId, id])`), not a bare `where: { id }` — enforces "no cross-tenant
// operations" at the Prisma/SQL level, independent of RLS (which doesn't exist yet), matching
// the established pattern from modules/users' repositories.
export class PrismaClassRepository implements ClassRepository {
  async findById(tenantId: string, id: string): Promise<ClassEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.class.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: ClassListFilter): Promise<ClassListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where = {
        tenantId,
        deletedAt: null,
        ...(filter.academicSessionId ? { academicSessionId: filter.academicSessionId } : {}),
      };

      const [rows, total] = await Promise.all([
        tx.class.findMany({
          where,
          orderBy: { name: "asc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.class.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async create(input: CreateClassInput): Promise<ClassEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.class.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          academicSessionId: input.academicSessionId,
          name: input.name,
          grade: input.grade ?? null,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateClassInput): Promise<ClassEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.class.update({
        where: { tenantId_id: { tenantId, id } },
        data: { name: input.name, grade: input.grade, updatedBy: input.updatedBy ?? null },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ClassEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.class.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async restore(tenantId: string, id: string, updatedBy: string | null): Promise<ClassEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.class.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, updatedBy },
      })
    );
    return toEntity(row);
  }
}
