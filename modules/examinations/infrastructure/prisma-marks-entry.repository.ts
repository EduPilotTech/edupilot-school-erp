import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { Prisma, MarksEntry as PrismaMarksEntry } from "@/lib/generated/prisma/client";
import type { MarkOneInput, MarksEntryRepository } from "../domain/marks-entry.repository";
import type { MarksEntryEntity } from "../domain/marks-entry.entity";

function toEntity(row: PrismaMarksEntry): MarksEntryEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    examSubjectId: row.examSubjectId,
    studentId: row.studentId,
    marksObtained: row.marksObtained,
    isAbsent: row.isAbsent,
    remarks: row.remarks,
    enteredBy: row.enteredBy,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaMarksEntryRepository implements MarksEntryRepository {
  async findByExamSubject(tenantId: string, examSubjectId: string): Promise<MarksEntryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.marksEntry.findMany({
        where: { tenantId, examSubjectId },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findByExamSubjectAndStudent(
    tenantId: string,
    examSubjectId: string,
    studentId: string
  ): Promise<MarksEntryEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.marksEntry.findUnique({
        where: { tenantId_examSubjectId_studentId: { tenantId, examSubjectId, studentId } },
      })
    );
    return row ? toEntity(row) : null;
  }

  async findByStudentAndExam(tenantId: string, studentId: string, examId: string): Promise<MarksEntryEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.marksEntry.findMany({
        where: { tenantId, studentId, examSubject: { examId } },
        orderBy: { createdAt: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async markOne(input: MarkOneInput, tx?: Prisma.TransactionClient): Promise<MarksEntryEntity> {
    const row = await withTenantContext(
      input.tenantId,
      (t) =>
        t.marksEntry.upsert({
          where: {
            tenantId_examSubjectId_studentId: {
              tenantId: input.tenantId,
              examSubjectId: input.examSubjectId,
              studentId: input.studentId,
            },
          },
          create: {
            tenantId: input.tenantId,
            examSubjectId: input.examSubjectId,
            studentId: input.studentId,
            marksObtained: input.marksObtained,
            isAbsent: input.isAbsent,
            remarks: input.remarks ?? null,
            enteredBy: input.enteredBy ?? null,
            createdBy: input.enteredBy ?? null,
          },
          // Correcting an existing entry updates marks/absence/remarks/enterer only — matches
          // StudentAttendance.markOne's own "re-mark corrects, never appends" semantics.
          update: {
            marksObtained: input.marksObtained,
            isAbsent: input.isAbsent,
            remarks: input.remarks ?? null,
            enteredBy: input.enteredBy ?? null,
            updatedBy: input.enteredBy ?? null,
          },
        }),
      tx
    );
    return toEntity(row);
  }
}
