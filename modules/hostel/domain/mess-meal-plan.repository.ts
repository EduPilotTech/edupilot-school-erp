import type { MessMealPlanEntity } from "./mess-meal-plan.entity";

export interface CreateMessMealPlanInput {
  tenantId: string;
  hostelId: string;
  name: string;
  description?: string | null;
  createdBy?: string | null;
}

export interface UpdateMessMealPlanInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface MessMealPlanRepository {
  findById(tenantId: string, id: string): Promise<MessMealPlanEntity | null>;
  findByHostel(tenantId: string, hostelId: string): Promise<MessMealPlanEntity[]>;
  create(input: CreateMessMealPlanInput): Promise<MessMealPlanEntity>;
  update(tenantId: string, id: string, input: UpdateMessMealPlanInput): Promise<MessMealPlanEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<MessMealPlanEntity>;
}
