import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { MessMeal as PrismaMessMeal } from "@/lib/generated/prisma/client";
import type { CreateMessMealInput, MessMealRepository, UpdateMessMealInput } from "../domain/mess-meal.repository";
import type { MessMealEntity } from "../domain/mess-meal.entity";

function toEntity(row: PrismaMessMeal): MessMealEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    mealPlanId: row.mealPlanId,
    mealType: row.mealType,
    dietType: row.dietType,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaMessMealRepository implements MessMealRepository {
  async findById(tenantId: string, id: string): Promise<MessMealEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.messMeal.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByMealPlan(tenantId: string, mealPlanId: string): Promise<MessMealEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.messMeal.findMany({
        where: { tenantId, mealPlanId, deletedAt: null },
        orderBy: { mealType: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateMessMealInput): Promise<MessMealEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.messMeal.create({
        data: {
          tenantId: input.tenantId,
          mealPlanId: input.mealPlanId,
          mealType: input.mealType,
          dietType: input.dietType,
          description: input.description ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateMessMealInput): Promise<MessMealEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.messMeal.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          description: input.description,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<MessMealEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.messMeal.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
