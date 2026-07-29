import type { Prisma } from "@/lib/generated/prisma/client";
import type { MarksEntryEntity } from "./marks-entry.entity";

export interface MarkOneInput {
  tenantId: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string | null;
  enteredBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6. `markOne` upserts
// on the `@@unique([tenantId, examSubjectId, studentId])` constraint — a correction updates the
// existing row, exactly like modules/attendance's StudentAttendanceRepository.markOne.
export interface MarksEntryRepository {
  findByExamSubject(tenantId: string, examSubjectId: string): Promise<MarksEntryEntity[]>;
  findByExamSubjectAndStudent(
    tenantId: string,
    examSubjectId: string,
    studentId: string
  ): Promise<MarksEntryEntity | null>;
  // Every mark a student has for every subject of one exam — backs Report Card's per-subject
  // breakdown and result-generation.service.ts's aggregation.
  findByStudentAndExam(tenantId: string, studentId: string, examId: string): Promise<MarksEntryEntity[]>;
  markOne(input: MarkOneInput, tx?: Prisma.TransactionClient): Promise<MarksEntryEntity>;
}
