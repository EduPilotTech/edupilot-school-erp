import "server-only";
import { PrismaMessMealRepository } from "../infrastructure/prisma-mess-meal.repository";
import { toMessMealDTO } from "./create-mess-meal.service";
import type { MessMealDTO } from "./dto/mess.dto";

export async function listMessMeals(context: { tenantId: string }, mealPlanId: string): Promise<MessMealDTO[]> {
  const repository = new PrismaMessMealRepository();
  const meals = await repository.findByMealPlan(context.tenantId, mealPlanId);
  return meals.map(toMessMealDTO);
}
