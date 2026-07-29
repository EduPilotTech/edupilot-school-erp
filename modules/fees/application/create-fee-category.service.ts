import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaFeeCategoryRepository } from "../infrastructure/prisma-fee-category.repository";
import { FeeCategoryAlreadyExistsError } from "../domain/errors";
import { createFeeCategorySchema, type FeeCategoryDTO } from "./dto/fee-category.dto";
import type { FeeCategoryEntity } from "../domain/fee-category.entity";

export interface FeeCategoryContext {
  tenantId: string;
  schoolId: string;
  actingUserId: string;
}

function toDTO(entity: FeeCategoryEntity): FeeCategoryDTO {
  return {
    id: entity.id,
    schoolId: entity.schoolId,
    name: entity.name,
    code: entity.code,
    isRecurring: entity.isRecurring,
    hsnSacCode: entity.hsnSacCode,
    taxRatePercent: entity.taxRatePercent,
    isActive: entity.isActive,
  };
}

export async function createFeeCategory(input: unknown, context: FeeCategoryContext): Promise<FeeCategoryDTO> {
  const parsed = createFeeCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fee category data.");
  }
  const data = parsed.data;
  const { tenantId, schoolId, actingUserId } = context;

  const repository = new PrismaFeeCategoryRepository();
  const existing = await repository.findByCode(tenantId, data.code);
  if (existing) {
    throw new FeeCategoryAlreadyExistsError();
  }

  try {
    const category = await repository.create({
      tenantId,
      schoolId,
      name: data.name,
      code: data.code,
      isRecurring: data.isRecurring,
      hsnSacCode: data.hsnSacCode ?? null,
      taxRatePercent: data.taxRatePercent ?? null,
      createdBy: actingUserId,
    });
    return toDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FeeCategoryAlreadyExistsError();
    }
    throw error;
  }
}

export { toDTO as toFeeCategoryDTO };
