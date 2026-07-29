import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Subject as PrismaSubject } from "@/lib/generated/prisma/client";
import type {
  CreateSubjectInput,
  SubjectListFilter,
  SubjectListResult,
  SubjectRepository,
  UpdateSubjectInput,
} from "../domain/subject.repository";
import type { SubjectEntity } from "../domain/subject.entity";

function toEntity(row: PrismaSubject): SubjectEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
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

// Every tenant-scoped lookup/write uses the `tenantId_id` compound unique (from
// `@@unique([tenantId, id])`), not a bare `where: { id }` — matches PrismaClassRepository's own
// precedent.
export class PrismaSubjectRepository implements SubjectRepository {
  async findById(tenantId: string, id: string): Promise<SubjectEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.subject.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<SubjectEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.subject.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: SubjectListFilter): Promise<SubjectListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where = { tenantId, deletedAt: null };

      const [rows, total] = await Promise.all([
        tx.subject.findMany({
          where,
          orderBy: { name: "asc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.subject.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async create(input: CreateSubjectInput): Promise<SubjectEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.subject.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateSubjectInput): Promise<SubjectEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.subject.update({
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

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<SubjectEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.subject.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async restore(tenantId: string, id: string, updatedBy: string | null): Promise<SubjectEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.subject.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, isActive: true, updatedBy },
      })
    );
    return toEntity(row);
  }
}
