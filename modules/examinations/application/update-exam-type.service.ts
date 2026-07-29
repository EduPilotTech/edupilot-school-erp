import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaExamTypeRepository } from "../infrastructure/prisma-exam-type.repository";
import { ExamTypeAlreadyExistsError, ExamTypeNotFoundError } from "../domain/errors";
import { updateExamTypeSchema, type ExamTypeDTO } from "./dto/exam-type.dto";

export interface UpdateExamTypeContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: { id: string; name: string; code: string; isActive: boolean }): ExamTypeDTO {
  return { id: entity.id, name: entity.name, code: entity.code, isActive: entity.isActive };
}

export async function updateExamType(
  examTypeId: string,
  input: unknown,
  context: UpdateExamTypeContext
): Promise<ExamTypeDTO> {
  const parsed = updateExamTypeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid exam type data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaExamTypeRepository();
  const existing = await repository.findById(tenantId, examTypeId);
  if (!existing || existing.deletedAt !== null) {
    throw new ExamTypeNotFoundError();
  }

  try {
    const examType = await repository.update(tenantId, examTypeId, {
      name: data.name,
      code: data.code,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
    return toDTO(examType);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ExamTypeAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteExamType(examTypeId: string, context: UpdateExamTypeContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaExamTypeRepository();
  const existing = await repository.findById(tenantId, examTypeId);
  if (!existing || existing.deletedAt !== null) {
    throw new ExamTypeNotFoundError();
  }
  await repository.softDelete(tenantId, examTypeId, actingUserId);
}
