import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { PrismaExamTypeRepository } from "../infrastructure/prisma-exam-type.repository";
import { PrismaGradeScaleRepository } from "../infrastructure/prisma-grade-scale.repository";
import { ExamAlreadyExistsError, ExamTypeNotFoundError, GradeScaleNotFoundError } from "../domain/errors";
import { createExamSchema, type ExamDTO } from "./dto/exam.dto";
import type { ExamEntity } from "../domain/exam.entity";

export interface CreateExamContext {
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

// Always created in DRAFT (the schema's own default) — moving it forward is
// update-exam-status.service.ts's job, never set here.
export async function createExam(input: unknown, context: CreateExamContext): Promise<ExamDTO> {
  const parsed = createExamSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid exam data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  if (data.endDate.getTime() < data.startDate.getTime()) {
    throw new ValidationError("End date must be on or after the start date.");
  }

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const examTypeRepository = new PrismaExamTypeRepository();
  const examType = await examTypeRepository.findById(tenantId, data.examTypeId);
  if (!examType || examType.deletedAt !== null) {
    throw new ExamTypeNotFoundError();
  }

  if (data.gradeScaleId) {
    const gradeScaleRepository = new PrismaGradeScaleRepository();
    const gradeScale = await gradeScaleRepository.findById(tenantId, data.gradeScaleId);
    if (!gradeScale || gradeScale.deletedAt !== null || gradeScale.academicSessionId !== data.academicSessionId) {
      throw new GradeScaleNotFoundError();
    }
  }

  const repository = new PrismaExamRepository();
  try {
    const exam = await repository.create({
      tenantId,
      academicSessionId: data.academicSessionId,
      examTypeId: data.examTypeId,
      gradeScaleId: data.gradeScaleId ?? null,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      createdBy: actingUserId,
    });
    return toDTO(exam);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ExamAlreadyExistsError();
    }
    throw error;
  }
}
