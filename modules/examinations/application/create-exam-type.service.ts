import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaExamTypeRepository } from "../infrastructure/prisma-exam-type.repository";
import { ExamTypeAlreadyExistsError } from "../domain/errors";
import { createExamTypeSchema, type ExamTypeDTO } from "./dto/exam-type.dto";

export interface CreateExamTypeContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: { id: string; name: string; code: string; isActive: boolean }): ExamTypeDTO {
  return { id: entity.id, name: entity.name, code: entity.code, isActive: entity.isActive };
}

// Service-layer pre-check (friendly message) backstopped by the DB's own
// `@@unique([tenantId, code])` constraint (P2002 fallback) — same two-layer guarantee pattern
// used throughout this codebase (e.g. create-subject.service.ts).
export async function createExamType(input: unknown, context: CreateExamTypeContext): Promise<ExamTypeDTO> {
  const parsed = createExamTypeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid exam type data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaExamTypeRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) {
    throw new ExamTypeAlreadyExistsError();
  }

  try {
    const examType = await repository.create({
      tenantId,
      name: data.name,
      code: data.code,
      createdBy: actingUserId,
    });
    return toDTO(examType);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ExamTypeAlreadyExistsError();
    }
    throw error;
  }
}
