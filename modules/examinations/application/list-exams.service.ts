import "server-only";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import type { ExamEntity } from "../domain/exam.entity";

export async function listExams(
  academicSessionId: string,
  context: { tenantId: string }
): Promise<ExamEntity[]> {
  const repository = new PrismaExamRepository();
  return repository.findByAcademicSession(context.tenantId, academicSessionId);
}
