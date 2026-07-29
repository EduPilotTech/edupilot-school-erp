import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { ExamType as PrismaExamType } from "@/lib/generated/prisma/client";
import type {
  CreateExamTypeInput,
  ExamTypeListFilter,
  ExamTypeListResult,
  ExamTypeRepository,
  UpdateExamTypeInput,
} from "../domain/exam-type.repository";
import type { ExamTypeEntity } from "../domain/exam-type.entity";

function toEntity(row: PrismaExamType): ExamTypeEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
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
// `@@unique([tenantId, id])`), not a bare `where: { id }` — matches PrismaSubjectRepository's
// own precedent.
export class PrismaExamTypeRepository implements ExamTypeRepository {
  async findById(tenantId: string, id: string): Promise<ExamTypeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examType.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<ExamTypeEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examType.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: ExamTypeListFilter): Promise<ExamTypeListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where = { tenantId, deletedAt: null };

      const [rows, total] = await Promise.all([
        tx.examType.findMany({
          where,
          orderBy: { name: "asc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.examType.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async create(input: CreateExamTypeInput): Promise<ExamTypeEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.examType.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateExamTypeInput): Promise<ExamTypeEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examType.update({
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

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ExamTypeEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examType.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async restore(tenantId: string, id: string, updatedBy: string | null): Promise<ExamTypeEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examType.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, isActive: true, updatedBy },
      })
    );
    return toEntity(row);
  }
}
