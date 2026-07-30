import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaMessMealPlanRepository } from "../infrastructure/prisma-mess-meal-plan.repository";
import { PrismaMessMealRepository } from "../infrastructure/prisma-mess-meal.repository";
import { MessMealPlanNotFoundError } from "../domain/errors";
import { createMessMealSchema, type MessMealDTO } from "./dto/mess.dto";
import type { MessMealEntity } from "../domain/mess-meal.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: MessMealEntity): MessMealDTO {
  return {
    id: entity.id,
    mealPlanId: entity.mealPlanId,
    mealType: entity.mealType,
    dietType: entity.dietType,
    description: entity.description,
    isActive: entity.isActive,
  };
}

export async function createMessMeal(input: unknown, context: HostelContext): Promise<MessMealDTO> {
  const parsed = createMessMealSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid meal data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const planRepository = new PrismaMessMealPlanRepository();
  const plan = await planRepository.findById(tenantId, data.mealPlanId);
  if (!plan || plan.deletedAt !== null) {
    throw new MessMealPlanNotFoundError();
  }

  const repository = new PrismaMessMealRepository();
  try {
    const meal = await repository.create({
      tenantId,
      mealPlanId: data.mealPlanId,
      mealType: data.mealType,
      dietType: data.dietType,
      description: data.description ?? null,
      createdBy: actingUserId,
    });
    return toDTO(meal);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ValidationError("This meal type and diet type combination already exists in this plan.");
    }
    throw error;
  }
}

export { toDTO as toMessMealDTO };
