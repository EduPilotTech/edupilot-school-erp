import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Enrollment as PrismaEnrollment, Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateEnrollmentInput,
  EnrollmentRepository,
} from "../domain/enrollment.repository";
import type { EnrollmentEntity, EnrollmentStatusValue } from "../domain/enrollment.entity";

function toEntity(row: PrismaEnrollment): EnrollmentEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    studentId: row.studentId,
    academicSessionId: row.academicSessionId,
    classId: row.classId,
    sectionId: row.sectionId,
    rollNumber: row.rollNumber,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as EnrollmentStatusValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

// No (tenantId, id) compound unique on Enrollment (nothing references it via composite FK) —
// `findFirst` with `tenantId` as an explicit filter, same approach as StudentGuardian.
//
// Notice there is no `update` method here at all — only `create` and `close`, matching the
// domain interface exactly. This is deliberate: the infrastructure layer cannot expose a
// generic update even if a future caller wanted one, because the interface it implements
// doesn't declare one. "Never overwrite historical enrollment" is enforced by the type system,
// not just a comment.
export class PrismaEnrollmentRepository implements EnrollmentRepository {
  async findCurrentForStudent(
    tenantId: string,
    studentId: string,
    academicSessionId: string
  ): Promise<EnrollmentEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.enrollment.findFirst({
        where: { tenantId, studentId, academicSessionId, endDate: null },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findHistoryForStudent(tenantId: string, studentId: string): Promise<EnrollmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.enrollment.findMany({
        where: { tenantId, studentId },
        orderBy: { startDate: "desc" },
      })
    );
    return rows.map(toEntity);
  }

  async findCurrentForClass(
    tenantId: string,
    classId: string,
    academicSessionId: string
  ): Promise<EnrollmentEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.enrollment.findMany({
        where: { tenantId, classId, academicSessionId, endDate: null },
        orderBy: { rollNumber: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(
    input: CreateEnrollmentInput,
    tx?: Prisma.TransactionClient
  ): Promise<EnrollmentEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.enrollment.create({
          data: {
            tenantId: input.tenantId,
            studentId: input.studentId,
            academicSessionId: input.academicSessionId,
            classId: input.classId,
            sectionId: input.sectionId,
            rollNumber: input.rollNumber ?? null,
            startDate: input.startDate,
            createdBy: input.createdBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async close(
    tenantId: string,
    id: string,
    endDate: Date,
    status: EnrollmentStatusValue,
    updatedBy: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<EnrollmentEntity> {
    // One transaction, not two: `updateMany` (rather than `update`, since there's no
    // (tenantId, id) compound unique to satisfy `update`'s unique-where requirement) followed
    // by a re-fetch to return the current row — both against `{ id, tenantId }` explicitly, so
    // tenant scoping is never dropped even though `id` alone is already globally unique as the
    // primary key.
    return withTenantContext(
      tenantId,
      async (t) => {
        const { count } = await t.enrollment.updateMany({
          where: { id, tenantId },
          data: { endDate, status, updatedBy },
        });

        if (count === 0) {
          throw new Error(`Enrollment ${id} not found for tenant ${tenantId}.`);
        }

        const row = await t.enrollment.findFirstOrThrow({ where: { id, tenantId } });
        return toEntity(row);
      },
      tx
    );
  }
}
