import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { InvalidClassError } from "@/modules/students/domain/errors";
import { PrismaClassRepository } from "@/modules/academics/infrastructure/prisma-class.repository";
import { PrismaSubjectRepository } from "@/modules/academics/infrastructure/prisma-subject.repository";
import { SubjectNotFoundError } from "@/modules/academics/domain/errors";
import { PrismaExamRepository } from "../infrastructure/prisma-exam.repository";
import { PrismaExamSubjectRepository } from "../infrastructure/prisma-exam-subject.repository";
import { ExamNotFoundError, ExamSubjectAlreadyExistsError, InvalidExamStatusError } from "../domain/errors";
import { requiresOneOfStatuses } from "./exam-lifecycle.helpers";
import { addExamSubjectSchema, type ExamSubjectDTO } from "./dto/exam-subject.dto";

export interface AddExamSubjectContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: {
  id: string;
  examId: string;
  classId: string;
  subjectId: string;
  maxMarks: number;
  passingMarks: number;
  isActive: boolean;
}): ExamSubjectDTO {
  return {
    id: entity.id,
    examId: entity.examId,
    classId: entity.classId,
    subjectId: entity.subjectId,
    maxMarks: entity.maxMarks,
    passingMarks: entity.passingMarks,
    isActive: entity.isActive,
  };
}

// Exam-setup-phase data — only addable while the exam is still DRAFT or SCHEDULED, before any
// marks entry could have started against it (ONGOING onward).
export async function addExamSubject(input: unknown, context: AddExamSubjectContext): Promise<ExamSubjectDTO> {
  const parsed = addExamSubjectSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid exam subject data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  if (data.passingMarks > data.maxMarks) {
    throw new ValidationError("Passing marks cannot exceed max marks.");
  }

  const examRepository = new PrismaExamRepository();
  const exam = await examRepository.findById(tenantId, data.examId);
  if (!exam || exam.deletedAt !== null) {
    throw new ExamNotFoundError();
  }
  const statusError = requiresOneOfStatuses(exam.status, ["DRAFT", "SCHEDULED"]);
  if (statusError) {
    throw new InvalidExamStatusError(statusError);
  }

  const classRepository = new PrismaClassRepository();
  const classEntity = await classRepository.findById(tenantId, data.classId);
  if (!classEntity || classEntity.deletedAt !== null) {
    throw new InvalidClassError();
  }

  const subjectRepository = new PrismaSubjectRepository();
  const subject = await subjectRepository.findById(tenantId, data.subjectId);
  if (!subject || subject.deletedAt !== null) {
    throw new SubjectNotFoundError();
  }

  const repository = new PrismaExamSubjectRepository();
  const existing = await repository.findByExamAndClass(tenantId, data.examId, data.classId);
  if (existing.some((examSubject) => examSubject.subjectId === data.subjectId)) {
    throw new ExamSubjectAlreadyExistsError();
  }

  try {
    const examSubject = await repository.create({
      tenantId,
      examId: data.examId,
      classId: data.classId,
      subjectId: data.subjectId,
      maxMarks: data.maxMarks,
      passingMarks: data.passingMarks,
      createdBy: actingUserId,
    });
    return toDTO(examSubject);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ExamSubjectAlreadyExistsError();
    }
    throw error;
  }
}
