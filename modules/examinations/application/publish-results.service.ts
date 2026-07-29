import "server-only";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { ExamNotFoundError, InvalidExamStatusError } from "../domain/errors";
import { requiresStatus, validateStatusTransition } from "./exam-lifecycle.helpers";
import type { ExamDTO } from "./dto/exam.dto";
import type { ExamEntity } from "../domain/exam.entity";

export interface PublishResultsContext {
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

// Publishing is just the RESULT_GENERATED -> RESULT_PUBLISHED move — no per-row "published" flag
// exists on ExamResult (see its own schema comment): every result under this Exam becomes locked
// at once because every read of it is scoped by its parent Exam's status. This is what makes
// publish inherently "bulk" over results without needing to touch a single ExamResult row.
export async function publishResults(examId: string, context: PublishResultsContext): Promise<ExamDTO> {
  const { tenantId, actingUserId } = context;

  const repository = new PrismaExamRepository();
  const exam = await repository.findById(tenantId, examId);
  if (!exam || exam.deletedAt !== null) {
    throw new ExamNotFoundError();
  }

  const statusError = requiresStatus(exam.status, "RESULT_GENERATED");
  if (statusError) {
    throw new InvalidExamStatusError(statusError);
  }
  const transitionError = validateStatusTransition(exam.status, "RESULT_PUBLISHED");
  if (transitionError) {
    throw new InvalidExamStatusError(transitionError);
  }

  const updated = await repository.update(tenantId, examId, {
    status: "RESULT_PUBLISHED",
    updatedBy: actingUserId,
  });
  return toDTO(updated);
}

// Phase 7 Decision 9's "bulk publish" — many exams, one action, atomically (either every exam in
// the batch publishes, or none do).
export async function bulkPublishResults(examIds: string[], context: PublishResultsContext): Promise<ExamDTO[]> {
  if (examIds.length === 0) {
    throw new ValidationError("At least one exam is required.");
  }
  const { tenantId } = context;

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

    const repository = new PrismaExamRepository();
    const results: ExamDTO[] = [];
    for (const examId of examIds) {
      const exam = await repository.findById(tenantId, examId);
      if (!exam || exam.deletedAt !== null) {
        throw new ExamNotFoundError();
      }
      const statusError = requiresStatus(exam.status, "RESULT_GENERATED");
      if (statusError) {
        throw new InvalidExamStatusError(statusError);
      }
      const updated = await repository.update(
        tenantId,
        examId,
        { status: "RESULT_PUBLISHED", updatedBy: context.actingUserId },
        tx
      );
      results.push(toDTO(updated));
    }
    return results;
  });
}
