import "server-only";
import { prisma } from "@/lib/prisma";
import { listCurrentEnrollmentsForClass } from "@/modules/students/application/list-current-enrollments.service";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { PrismaExamSubjectRepository } from "../infrastructure/prisma-exam-subject.repository";
import { PrismaExamResultRepository } from "../infrastructure/prisma-exam-result.repository";
import { generateResult } from "./generate-result.service";
import { computeRanks } from "./ranking.helpers";
import { ExamNotFoundError, InvalidExamStatusError } from "../domain/errors";
import { requiresStatus, validateStatusTransition } from "./exam-lifecycle.helpers";
import type { ExamResultDTO } from "./dto/exam-result.dto";

export interface BulkGenerateResultsContext {
  tenantId: string;
  actingUserId: string;
}

// Generates a result for every currently-enrolled student across every class this Exam examines,
// then ranks each (class, section) group (shared ranks for ties — Phase 7 Decision 3), then
// advances the Exam to RESULT_GENERATED — all in one transaction, matching
// bulk-mark-student-attendance.service.ts's own atomic-batch precedent. Phase 7 Decision 9's
// "bulk result generation."
export async function bulkGenerateResults(
  examId: string,
  context: BulkGenerateResultsContext
): Promise<ExamResultDTO[]> {
  const { tenantId, actingUserId } = context;

  const examRepository = new PrismaExamRepository();
  const exam = await examRepository.findById(tenantId, examId);
  if (!exam || exam.deletedAt !== null) {
    throw new ExamNotFoundError();
  }
  const statusError = requiresStatus(exam.status, "MARKS_ENTRY_COMPLETED");
  if (statusError) {
    throw new InvalidExamStatusError(statusError);
  }

  const examSubjectRepository = new PrismaExamSubjectRepository();
  const examSubjects = await examSubjectRepository.findByExam(tenantId, examId);
  const classIds = [...new Set(examSubjects.map((examSubject) => examSubject.classId))];

  const rosterByClass = await Promise.all(
    classIds.map((classId) => listCurrentEnrollmentsForClass(classId, exam.academicSessionId, { tenantId }))
  );
  const allEnrollments = rosterByClass.flat();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const results: ExamResultDTO[] = [];
    for (const enrollment of allEnrollments) {
      const result = await generateResult(examId, enrollment.studentId, context, tx);
      results.push(result);
    }

    const groups = new Map<string, ExamResultDTO[]>();
    for (const result of results) {
      const key = `${result.classId}|${result.sectionId}`;
      const group = groups.get(key) ?? [];
      group.push(result);
      groups.set(key, group);
    }

    const resultRepository = new PrismaExamResultRepository();
    const rankByResultId = new Map<string, number>();
    for (const group of groups.values()) {
      const ranks = computeRanks(group.map((result) => ({ id: result.id, percentage: result.percentage })));
      await resultRepository.updateRanks(tenantId, ranks, tx);
      for (const ranked of ranks) {
        rankByResultId.set(ranked.id, ranked.rank);
      }
    }

    // validateStatusTransition is re-checked here (not just requiresStatus above) purely for
    // symmetry with updateExamStatus's own guarantee — MARKS_ENTRY_COMPLETED -> RESULT_GENERATED
    // is always the correct single-step move once requiresStatus has already confirmed the
    // starting state.
    const transitionError = validateStatusTransition(exam.status, "RESULT_GENERATED");
    if (transitionError) {
      throw new InvalidExamStatusError(transitionError);
    }
    await examRepository.update(tenantId, examId, { status: "RESULT_GENERATED", updatedBy: actingUserId }, tx);

    return results.map((result) => ({ ...result, rank: rankByResultId.get(result.id) ?? null }));
  });
}
