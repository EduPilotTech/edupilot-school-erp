import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaFeeCategoryRepository } from "../infrastructure/prisma-fee-category.repository";
import { FeeCategoryAlreadyExistsError, FeeCategoryNotFoundError } from "../domain/errors";
import { updateFeeCategorySchema, type FeeCategoryDTO } from "./dto/fee-category.dto";
import { toFeeCategoryDTO } from "./create-fee-category.service";

export interface UpdateFeeCategoryContext {
  tenantId: string;
  actingUserId: string;
}

export async function updateFeeCategory(
  categoryId: string,
  input: unknown,
  context: UpdateFeeCategoryContext
): Promise<FeeCategoryDTO> {
  const parsed = updateFeeCategorySchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fee category data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaFeeCategoryRepository();
  const existing = await repository.findById(tenantId, categoryId);
  if (!existing || existing.deletedAt !== null) {
    throw new FeeCategoryNotFoundError();
  }

  try {
    const category = await repository.update(tenantId, categoryId, {
      name: data.name,
      code: data.code,
      isRecurring: data.isRecurring,
      hsnSacCode: data.hsnSacCode,
      taxRatePercent: data.taxRatePercent,
      isActive: data.isActive,
      updatedBy: actingUserId,
    });
    return toFeeCategoryDTO(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FeeCategoryAlreadyExistsError();
    }
    throw error;
  }
}

export async function deleteFeeCategory(categoryId: string, context: UpdateFeeCategoryContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaFeeCategoryRepository();
  const existing = await repository.findById(tenantId, categoryId);
  if (!existing || existing.deletedAt !== null) {
    throw new FeeCategoryNotFoundError();
  }
  await repository.softDelete(tenantId, categoryId, actingUserId);
}
