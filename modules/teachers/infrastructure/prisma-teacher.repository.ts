import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Teacher as PrismaTeacher } from "@/lib/generated/prisma/client";
import type {
  CreateTeacherInput,
  TeacherListFilter,
  TeacherListResult,
  TeacherRepository,
  UpdateTeacherInput,
} from "../domain/teacher.repository";
import type { TeacherEntity } from "../domain/teacher.entity";

function toEntity(row: PrismaTeacher): TeacherEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userProfileId: row.userProfileId,
    employeeCode: row.employeeCode,
    joiningDate: row.joiningDate,
    qualification: row.qualification,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// Every tenant-scoped lookup/write uses a `tenantId_*` compound unique, not a bare `where: { id }`
// — matches PrismaClassRepository's own precedent.
export class PrismaTeacherRepository implements TeacherRepository {
  async findById(tenantId: string, id: string): Promise<TeacherEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.teacher.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByUserProfileId(tenantId: string, userProfileId: string): Promise<TeacherEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.teacher.findUnique({ where: { tenantId_userProfileId: { tenantId, userProfileId } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByEmployeeCode(tenantId: string, employeeCode: string): Promise<TeacherEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.teacher.findUnique({ where: { tenantId_employeeCode: { tenantId, employeeCode } } })
    );
    return row ? toEntity(row) : null;
  }

  async findMany(tenantId: string, filter: TeacherListFilter): Promise<TeacherListResult> {
    return withTenantContext(tenantId, async (tx) => {
      const where = { tenantId, deletedAt: null };

      const [rows, total] = await Promise.all([
        tx.teacher.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (filter.page - 1) * filter.pageSize,
          take: filter.pageSize,
        }),
        tx.teacher.count({ where }),
      ]);

      return { items: rows.map(toEntity), total, page: filter.page, pageSize: filter.pageSize };
    });
  }

  async create(input: CreateTeacherInput): Promise<TeacherEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.teacher.create({
        data: {
          tenantId: input.tenantId,
          userProfileId: input.userProfileId,
          employeeCode: input.employeeCode,
          joiningDate: input.joiningDate,
          qualification: input.qualification ?? null,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateTeacherInput): Promise<TeacherEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.teacher.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          employeeCode: input.employeeCode,
          joiningDate: input.joiningDate,
          qualification: input.qualification,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<TeacherEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.teacher.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }

  async restore(tenantId: string, id: string, updatedBy: string | null): Promise<TeacherEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.teacher.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: null, isActive: true, updatedBy },
      })
    );
    return toEntity(row);
  }
}
