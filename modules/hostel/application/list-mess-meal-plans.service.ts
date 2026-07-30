import "server-only";
import { PrismaMessMealPlanRepository } from "../infrastructure/prisma-mess-meal-plan.repository";
import { toMessMealPlanDTO } from "./create-mess-meal-plan.service";
import type { MessMealPlanDTO } from "./dto/mess.dto";

export async function listMessMealPlans(context: { tenantId: string }, hostelId: string): Promise<MessMealPlanDTO[]> {
  const repository = new PrismaMessMealPlanRepository();
  const plans = await repository.findByHostel(context.tenantId, hostelId);
  return plans.map(toMessMealPlanDTO);
}
