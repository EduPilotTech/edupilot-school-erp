import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaMessMealRepository } from "../infrastructure/prisma-mess-meal.repository";
import { MessMealNotFoundError } from "../domain/errors";
import { updateMessMealSchema, type MessMealDTO } from "./dto/mess.dto";
import { toMessMealDTO } from "./create-mess-meal.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateMessMeal(mealId: string, input: unknown, context: HostelContext): Promise<MessMealDTO> {
  const parsed = updateMessMealSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid meal data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaMessMealRepository();
  const existing = await repository.findById(tenantId, mealId);
  if (!existing || existing.deletedAt !== null) {
    throw new MessMealNotFoundError();
  }

  const meal = await repository.update(tenantId, mealId, {
    description: data.description,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toMessMealDTO(meal);
}

export async function deleteMessMeal(mealId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaMessMealRepository();
  const existing = await repository.findById(tenantId, mealId);
  if (!existing || existing.deletedAt !== null) {
    throw new MessMealNotFoundError();
  }
  await repository.softDelete(tenantId, mealId, actingUserId);
}
