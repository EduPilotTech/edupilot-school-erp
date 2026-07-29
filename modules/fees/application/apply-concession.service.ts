import "server-only";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError, StudentNotFoundError } from "@/modules/students/domain/errors";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student.repository";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaFeeCategoryRepository } from "../infrastructure/prisma-fee-category.repository";
import { PrismaFeeConcessionRepository } from "../infrastructure/prisma-fee-concession.repository";
import { FeeCategoryNotFoundError } from "../domain/errors";
import { recordFeeAudit } from "./fee-audit.helpers";
import { applyConcessionSchema, type FeeConcessionDTO } from "./dto/fee-concession.dto";
import type { FeeConcessionEntity } from "../domain/fee-concession.entity";

export interface ApplyConcessionContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: FeeConcessionEntity): FeeConcessionDTO {
  return {
    id: entity.id,
    studentId: entity.studentId,
    academicSessionId: entity.academicSessionId,
    feeCategoryId: entity.feeCategoryId,
    type: entity.type,
    valueType: entity.valueType,
    value: entity.value,
    reason: entity.reason,
    isActive: entity.isActive,
  };
}

// Unifies Discount, Scholarship, Concession, and Waiver (Phase 8 Decision 2). Newly applied
// concessions only affect invoices generated AFTER this call — existing invoices already carry
// their own snapshotted `discountAmount` and are never retroactively recalculated.
export async function applyConcession(input: unknown, context: ApplyConcessionContext): Promise<FeeConcessionDTO> {
  const parsed = applyConcessionSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid concession data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const studentRepository = new PrismaStudentRepository();
  const student = await studentRepository.findById(tenantId, data.studentId);
  if (!student || student.deletedAt !== null) {
    throw new StudentNotFoundError();
  }

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  if (data.feeCategoryId) {
    const categoryRepository = new PrismaFeeCategoryRepository();
    const category = await categoryRepository.findById(tenantId, data.feeCategoryId);
    if (!category || category.deletedAt !== null) {
      throw new FeeCategoryNotFoundError();
    }
  }

  const repository = new PrismaFeeConcessionRepository();
  const concession = await repository.create({
    tenantId,
    studentId: data.studentId,
    academicSessionId: data.academicSessionId,
    feeCategoryId: data.feeCategoryId ?? null,
    type: data.type,
    valueType: data.valueType,
    value: data.value,
    reason: data.reason ?? null,
    createdBy: actingUserId,
  });

  await recordFeeAudit({
    tenantId,
    actorId: actingUserId,
    action: "CONCESSION_APPLIED",
    entityType: "FeeConcession",
    entityId: concession.id,
    afterState: concession,
  });

  return toDTO(concession);
}

export { toDTO as toFeeConcessionDTO };
