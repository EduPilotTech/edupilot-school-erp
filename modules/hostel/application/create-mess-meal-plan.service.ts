import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelRepository } from "../infrastructure/prisma-hostel.repository";
import { PrismaMessMealPlanRepository } from "../infrastructure/prisma-mess-meal-plan.repository";
import { HostelNotFoundError } from "../domain/errors";
import { createMessMealPlanSchema, type MessMealPlanDTO } from "./dto/mess.dto";
import type { MessMealPlanEntity } from "../domain/mess-meal-plan.entity";
import type { HostelContext } from "./create-hostel.service";

function toDTO(entity: MessMealPlanEntity): MessMealPlanDTO {
  return {
    id: entity.id,
    hostelId: entity.hostelId,
    name: entity.name,
    description: entity.description,
    isActive: entity.isActive,
  };
}

export async function createMessMealPlan(input: unknown, context: HostelContext): Promise<MessMealPlanDTO> {
  const parsed = createMessMealPlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid meal plan data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const hostelRepository = new PrismaHostelRepository();
  const hostel = await hostelRepository.findById(tenantId, data.hostelId);
  if (!hostel || hostel.deletedAt !== null) {
    throw new HostelNotFoundError();
  }

  const repository = new PrismaMessMealPlanRepository();
  try {
    const plan = await repository.create({
      tenantId,
      hostelId: data.hostelId,
      name: data.name,
      description: data.description ?? null,
      createdBy: actingUserId,
    });
    return toDTO(plan);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ValidationError("A meal plan with this name already exists for this hostel.");
    }
    throw error;
  }
}

export { toDTO as toMessMealPlanDTO };
