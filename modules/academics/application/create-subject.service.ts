import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaSubjectRepository } from "../infrastructure/prisma-subject.repository";
import { SubjectAlreadyExistsError } from "../domain/errors";
import { createSubjectSchema, type SubjectDTO } from "./dto/subject.dto";

export interface CreateSubjectContext {
  tenantId: string;
  schoolId: string;
  actingUserId: string;
}

function toDTO(entity: { id: string; schoolId: string; name: string; code: string; isActive: boolean }): SubjectDTO {
  return { id: entity.id, schoolId: entity.schoolId, name: entity.name, code: entity.code, isActive: entity.isActive };
}

// Service-layer pre-check (friendly message) backstopped by the DB's own
// `@@unique([tenantId, code])` constraint (P2002 fallback) — same two-layer guarantee pattern
// used throughout this codebase (e.g. admit-student.service.ts's admissionNumber check).
export async function createSubject(input: unknown, context: CreateSubjectContext): Promise<SubjectDTO> {
  const parsed = createSubjectSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid subject data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaSubjectRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) {
    throw new SubjectAlreadyExistsError();
  }

  try {
    const subject = await repository.create({
      tenantId,
      schoolId,
      name: data.name,
      code: data.code,
      createdBy: actingUserId,
    });
    return toDTO(subject);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SubjectAlreadyExistsError();
    }
    throw error;
  }
}
