import "server-only";
import { PrismaExamSubjectRepository } from "../infrastructure/prisma-exam-subject.repository";
import type { ExamSubjectEntity } from "../domain/exam-subject.entity";

export async function listExamSubjectsForExam(
  examId: string,
  context: { tenantId: string }
): Promise<ExamSubjectEntity[]> {
  const repository = new PrismaExamSubjectRepository();
  return repository.findByExam(context.tenantId, examId);
}

export async function listExamSubjectsForExamAndClass(
  examId: string,
  classId: string,
  context: { tenantId: string }
): Promise<ExamSubjectEntity[]> {
  const repository = new PrismaExamSubjectRepository();
  return repository.findByExamAndClass(context.tenantId, examId, classId);
}
