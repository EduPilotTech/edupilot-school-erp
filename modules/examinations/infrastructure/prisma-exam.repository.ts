import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, Exam as PrismaExam } from "@/lib/generated/prisma/client";
import type { CreateExamInput, ExamRepository, UpdateExamInput } from "../domain/exam.repository";
import type { ExamEntity, ExamStatusValue } from "../domain/exam.entity";

function toEntity(row: PrismaExam): ExamEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    examTypeId: row.examTypeId,
    gradeScaleId: row.gradeScaleId,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as ExamStatusValue,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaExamRepository implements ExamRepository {
  async findById(tenantId: string, id: string): Promise<ExamEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.exam.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<ExamEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.exam.findMany({
        where: { tenantId, academicSessionId, deletedAt: null },
        orderBy: { startDate: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateExamInput): Promise<ExamEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.exam.create({
        data: {
          tenantId: input.tenantId,
          academicSessionId: input.academicSessionId,
          examTypeId: input.examTypeId,
          gradeScaleId: input.gradeScaleId ?? null,
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateExamInput,
    tx?: Prisma.TransactionClient
  ): Promise<ExamEntity> {
    const row = await withTenantContext(
      tenantId,
      (t) =>
        t.exam.update({
          where: { tenantId_id: { tenantId, id } },
          data: {
            examTypeId: input.examTypeId,
            gradeScaleId: input.gradeScaleId,
            name: input.name,
            startDate: input.startDate,
            endDate: input.endDate,
            status: input.status,
            updatedBy: input.updatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ExamEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.exam.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
