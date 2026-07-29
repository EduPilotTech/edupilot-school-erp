import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, ExamResult as PrismaExamResult } from "@/lib/generated/prisma/client";
import type {
  ExamResultRepository,
  RankUpdate,
  UpsertExamResultInput,
} from "../domain/exam-result.repository";
import type { ExamResultEntity, ExamResultStatusValue } from "../domain/exam-result.entity";

function toEntity(row: PrismaExamResult): ExamResultEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    examId: row.examId,
    studentId: row.studentId,
    classId: row.classId,
    sectionId: row.sectionId,
    totalMarksObtained: row.totalMarksObtained,
    totalMaxMarks: row.totalMaxMarks,
    percentage: row.percentage,
    overallGrade: row.overallGrade,
    gradePoint: row.gradePoint,
    rank: row.rank,
    status: row.status as ExamResultStatusValue,
    generatedAt: row.generatedAt,
    generatedBy: row.generatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaExamResultRepository implements ExamResultRepository {
  async findByExamAndStudent(tenantId: string, examId: string, studentId: string): Promise<ExamResultEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.examResult.findUnique({ where: { tenantId_examId_studentId: { tenantId, examId, studentId } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByExamClassSection(
    tenantId: string,
    examId: string,
    classId: string,
    sectionId: string
  ): Promise<ExamResultEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.examResult.findMany({
        where: { tenantId, examId, classId, sectionId },
        orderBy: [{ percentage: "desc" }],
      })
    );
    return rows.map(toEntity);
  }

  async findByStudent(tenantId: string, studentId: string): Promise<ExamResultEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.examResult.findMany({
        where: { tenantId, studentId },
        orderBy: { generatedAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async upsertOne(input: UpsertExamResultInput, tx?: Prisma.TransactionClient): Promise<ExamResultEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.examResult.upsert({
          where: { tenantId_examId_studentId: { tenantId: input.tenantId, examId: input.examId, studentId: input.studentId } },
          create: {
            tenantId: input.tenantId,
            examId: input.examId,
            studentId: input.studentId,
            classId: input.classId,
            sectionId: input.sectionId,
            totalMarksObtained: input.totalMarksObtained,
            totalMaxMarks: input.totalMaxMarks,
            percentage: input.percentage,
            overallGrade: input.overallGrade,
            gradePoint: input.gradePoint,
            status: input.status,
            generatedBy: input.generatedBy ?? null,
          },
          // Regeneration (while still allowed) replaces the computed figures and resets
          // `generatedAt`/`generatedBy` — `rank` is deliberately NOT touched here, since ranking
          // is a separate, whole-section pass (updateRanks) that runs after every student in the
          // section has been (re)generated.
          update: {
            totalMarksObtained: input.totalMarksObtained,
            totalMaxMarks: input.totalMaxMarks,
            percentage: input.percentage,
            overallGrade: input.overallGrade,
            gradePoint: input.gradePoint,
            status: input.status,
            generatedAt: new Date(),
            generatedBy: input.generatedBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }

  async updateRanks(tenantId: string, updates: RankUpdate[], tx?: Prisma.TransactionClient): Promise<void> {
    await withTenantContext(
      tenantId,
      async (t) => {
        await Promise.all(
          updates.map((update) =>
            t.examResult.update({
              where: { tenantId_id: { tenantId, id: update.id } },
              data: { rank: update.rank },
            })
          )
        );
      },
      tx
    );
  }
}
