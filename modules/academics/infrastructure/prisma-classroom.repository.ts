import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Classroom as PrismaClassroom } from "@/lib/generated/prisma/client";
import type {
  ClassroomListFilter,
  ClassroomListResult,
  ClassroomRepository,
  CreateClassroomInput,
  UpdateClassroomInput,
} from "../domain/classroom.repository";
import type { ClassroomEntity } from "../domain/classroom.entity";

function toEntity(row: PrismaClassroom): ClassroomEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    schoolId: row.schoolId,
    name: row.name,
    code: row.code,
    capacity: row.capacity,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaClassroomRepository implements ClassroomRepository {
  async findById(tenantId: string, id: string): Promise<ClassroomEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.classroom.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<ClassroomEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.classroom.findUnique({ where: { tenantId_code: { tenantId, code } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: ClassroomListFilter): Promise<ClassroomListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where = { tenantId, deletedAt: null };

      const [rows, total] = await Promise.all([
        tx.classroom.findMany({
          where,
          orderBy: { name: "asc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.classroom.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async create(input: CreateClassroomInput): Promise<ClassroomEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.classroom.create({
        data: {
          tenantId: input.tenantId,
          schoolId: input.schoolId,
          name: input.name,
          code: input.code,
          capacity: input.capacity ?? null,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateClassroomInput): Promise<ClassroomEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.classroom.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          code: input.code,
          capacity: input.capacity,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ClassroomEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.classroom.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async restore(tenantId: string, id: string, updatedBy: string | null): Promise<ClassroomEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.classroom.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, isActive: true, updatedBy },
      })
    );
    return toEntity(row);
  }
}
