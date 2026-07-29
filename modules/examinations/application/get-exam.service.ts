import "server-only";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { ExamNotFoundError } from "../domain/errors";
import type { ExamDTO } from "./dto/exam.dto";

export async function getExam(examId: string, context: { tenantId: string }): Promise<ExamDTO> {
  const repository = new PrismaExamRepository();
  const exam = await repository.findById(context.tenantId, examId);
  if (!exam || exam.deletedAt !== null) {
    throw new ExamNotFoundError();
  }
  return {
    id: exam.id,
    academicSessionId: exam.academicSessionId,
    examTypeId: exam.examTypeId,
    gradeScaleId: exam.gradeScaleId,
    name: exam.name,
    startDate: exam.startDate,
    endDate: exam.endDate,
    status: exam.status,
  };
}
