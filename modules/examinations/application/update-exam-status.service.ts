import "server-only";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { ExamNotFoundError, InvalidExamStatusError } from "../domain/errors";
import { validateStatusTransition } from "./exam-lifecycle.helpers";
import { ValidationError } from "@/lib/errors";
import { updateExamStatusSchema, type ExamDTO } from "./dto/exam.dto";
import type { ExamEntity } from "../domain/exam.entity";

export interface UpdateExamStatusContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: ExamEntity): ExamDTO {
  return {
    id: entity.id,
    academicSessionId: entity.academicSessionId,
    examTypeId: entity.examTypeId,
    gradeScaleId: entity.gradeScaleId,
    name: entity.name,
    startDate: entity.startDate,
    endDate: entity.endDate,
    status: entity.status,
  };
}

// Advances an Exam exactly one step along the Phase 7 Decision 8 lifecycle — the SCHEDULED and
// ONGOING transitions are plain status moves; MARKS_ENTRY_COMPLETED -> RESULT_GENERATED and
// RESULT_GENERATED -> RESULT_PUBLISHED have their own dedicated services
// (result-generation.service.ts, publish-results.service.ts) that call this internally after
// their own bulk work succeeds — this function itself only ever validates and writes the status
// field, it does not know what "generating results" or "publishing" actually means.
export async function updateExamStatus(
  examId: string,
  input: unknown,
  context: UpdateExamStatusContext
): Promise<ExamDTO> {
  const parsed = updateExamStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid status.");
  }
  const { tenantId, actingUserId } = context;

  const repository = new PrismaExamRepository();
  const existing = await repository.findById(tenantId, examId);
  if (!existing || existing.deletedAt !== null) {
    throw new ExamNotFoundError();
  }

  const transitionError = validateStatusTransition(existing.status, parsed.data.status);
  if (transitionError) {
    throw new InvalidExamStatusError(transitionError);
  }

  const exam = await repository.update(tenantId, examId, {
    status: parsed.data.status,
    updatedBy: actingUserId,
  });
  return toDTO(exam);
}
