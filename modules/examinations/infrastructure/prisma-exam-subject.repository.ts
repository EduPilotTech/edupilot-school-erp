import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { ExamSubject as PrismaExamSubject } from "@/lib/generated/prisma/client";
import type {
  CreateExamSubjectInput,
  ExamSubjectRepository,
  UpdateExamSubjectInput,
} from "../domain/exam-subject.repository";
import type { ExamSubjectEntity } from "../domain/exam-subject.entity";

function toEntity(row: PrismaExamSubject): ExamSubjectEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    examId: row.examId,
    classId: row.classId,
    subjectId: row.subjectId,
    maxMarks: row.maxMarks,
    passingMarks: row.passingMarks,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaExamSubjectRepository implements ExamSubjectRepository {
  async findById(tenantId: string, id: string): Promise<ExamSubjectEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examSubject.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByExam(tenantId: string, examId: string): Promise<ExamSubjectEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.examSubject.findMany({
        where: { tenantId, examId, deletedAt: null },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByExamAndClass(tenantId: string, examId: string, classId: string): Promise<ExamSubjectEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.examSubject.findMany({
        where: { tenantId, examId, classId, deletedAt: null },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateExamSubjectInput): Promise<ExamSubjectEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.examSubject.create({
        data: {
          tenantId: input.tenantId,
          examId: input.examId,
          classId: input.classId,
          subjectId: input.subjectId,
          maxMarks: input.maxMarks,
          passingMarks: input.passingMarks,
          createdBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateExamSubjectInput): Promise<ExamSubjectEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examSubject.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          maxMarks: input.maxMarks,
          passingMarks: input.passingMarks,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ExamSubjectEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examSubject.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
