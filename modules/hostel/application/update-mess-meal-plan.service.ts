import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaMessMealPlanRepository } from "../infrastructure/prisma-mess-meal-plan.repository";
import { MessMealPlanNotFoundError } from "../domain/errors";
import { updateMessMealPlanSchema, type MessMealPlanDTO } from "./dto/mess.dto";
import { toMessMealPlanDTO } from "./create-mess-meal-plan.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateMessMealPlan(
  planId: string,
  input: unknown,
  context: HostelContext
): Promise<MessMealPlanDTO> {
  const parsed = updateMessMealPlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid meal plan data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaMessMealPlanRepository();
  const existing = await repository.findById(tenantId, planId);
  if (!existing || existing.deletedAt !== null) {
    throw new MessMealPlanNotFoundError();
  }

  const plan = await repository.update(tenantId, planId, {
    name: data.name,
    description: data.description,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toMessMealPlanDTO(plan);
}

export async function deleteMessMealPlan(planId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaMessMealPlanRepository();
  const existing = await repository.findById(tenantId, planId);
  if (!existing || existing.deletedAt !== null) {
    throw new MessMealPlanNotFoundError();
  }
  await repository.softDelete(tenantId, planId, actingUserId);
}
