import "server-only";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaFeeCategoryRepository } from "../infrastructure/prisma-fee-category.repository";
import { PrismaFineRuleRepository } from "../infrastructure/prisma-fine-rule.repository";
import { FeeCategoryNotFoundError } from "../domain/errors";
import { createFineRuleSchema, type FineRuleDTO } from "./dto/fine-rule.dto";
import type { FineRuleEntity } from "../domain/fine-rule.entity";

export interface FineRuleContext {
  tenantId: string;
  actingUserId: string;
}

function toDTO(entity: FineRuleEntity): FineRuleDTO {
  return {
    id: entity.id,
    academicSessionId: entity.academicSessionId,
    feeCategoryId: entity.feeCategoryId,
    name: entity.name,
    gracePeriodDays: entity.gracePeriodDays,
    fineType: entity.fineType,
    fineValue: entity.fineValue,
    maxFineAmount: entity.maxFineAmount,
    isActive: entity.isActive,
  };
}

export async function createFineRule(input: unknown, context: FineRuleContext): Promise<FineRuleDTO> {
  const parsed = createFineRuleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fine rule data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

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

  const repository = new PrismaFineRuleRepository();
  const rule = await repository.create({
    tenantId,
    academicSessionId: data.academicSessionId,
    feeCategoryId: data.feeCategoryId ?? null,
    name: data.name,
    gracePeriodDays: data.gracePeriodDays,
    fineType: data.fineType,
    fineValue: data.fineValue,
    maxFineAmount: data.maxFineAmount ?? null,
    createdBy: actingUserId,
  });
  return toDTO(rule);
}

export { toDTO as toFineRuleDTO };
