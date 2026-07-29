import type { Prisma } from "@/lib/generated/prisma/client";
import type { ExamResultEntity, ExamResultStatusValue } from "./exam-result.entity";

export interface UpsertExamResultInput {
  tenantId: string;
  examId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string | null;
  gradePoint: number | null;
  status: ExamResultStatusValue;
  generatedBy?: string | null;
}

export interface RankUpdate {
  id: string;
  rank: number;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6. `upsertOne` is how
// result-generation.service.ts (re)generates a student's result — whether regeneration is still
// *allowed* (i.e. the parent Exam hasn't reached RESULT_PUBLISHED) is that service's job to
// check, not this repository's — see prisma/schema.prisma's ExamResult comment.
export interface ExamResultRepository {
  findByExamAndStudent(tenantId: string, examId: string, studentId: string): Promise<ExamResultEntity | null>;
  findByExamClassSection(
    tenantId: string,
    examId: string,
    classId: string,
    sectionId: string
  ): Promise<ExamResultEntity[]>;
  // Every result a student has across every exam — backs the Student Progress Report's
  // multi-exam trend view.
  findByStudent(tenantId: string, studentId: string): Promise<ExamResultEntity[]>;
  upsertOne(input: UpsertExamResultInput, tx?: Prisma.TransactionClient): Promise<ExamResultEntity>;
  // Assigns rank to a batch of already-generated results in one go — ranking.service.ts computes
  // shared ranks for ties (1, 1, 3, ...) across a full class/section, then writes them all here.
  updateRanks(tenantId: string, updates: RankUpdate[], tx?: Prisma.TransactionClient): Promise<void>;
}
