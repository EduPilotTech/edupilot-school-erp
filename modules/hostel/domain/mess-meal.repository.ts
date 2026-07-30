import type { DietTypeValue, MealTypeValue, MessMealEntity } from "./mess-meal.entity";

export interface CreateMessMealInput {
  tenantId: string;
  mealPlanId: string;
  mealType: MealTypeValue;
  dietType: DietTypeValue;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateMessMealInput {
  description?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface MessMealRepository {
  findById(tenantId: string, id: string): Promise<MessMealEntity | null>;
  findByMealPlan(tenantId: string, mealPlanId: string): Promise<MessMealEntity[]>;
  create(input: CreateMessMealInput): Promise<MessMealEntity>;
  update(tenantId: string, id: string, input: UpdateMessMealInput): Promise<MessMealEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<MessMealEntity>;
}
