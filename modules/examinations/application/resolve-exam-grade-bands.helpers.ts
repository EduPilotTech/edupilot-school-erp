import "server-only";
import { PrismaGradeScaleRepository } from "../infrastructure/prisma-grade-scale.repository";
import { PrismaGradeBandRepository } from "../infrastructure/prisma-grade-band.repository";
import type { ExamEntity } from "../domain/exam.entity";
import type { GradeBandEntity } from "../domain/grade-scale.entity";

// Resolves the band list result-generation.service.ts should grade against: the Exam's own
// `gradeScaleId` if set, otherwise the session's "Default"-named GradeScale. Returns an empty
// list (not an error) when neither exists — an ungraded result is still a valid result (numeric
// totals/percentage/rank are the core of "Result Generation"; the letter grade is a label on top
// of it, not a precondition for it).
export async function resolveGradeBandsForExam(tenantId: string, exam: ExamEntity): Promise<GradeBandEntity[]> {
  const scaleRepository = new PrismaGradeScaleRepository();
  const bandRepository = new PrismaGradeBandRepository();

  let scaleId = exam.gradeScaleId;
  if (!scaleId) {
    const defaultScale = await scaleRepository.findByName(tenantId, exam.academicSessionId, "Default");
    scaleId = defaultScale?.id ?? null;
  }
  if (!scaleId) {
    return [];
  }

  return bandRepository.findByGradeScale(tenantId, scaleId);
}
