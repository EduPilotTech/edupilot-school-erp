import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type { MessMealPlan as PrismaMessMealPlan } from "@/lib/generated/prisma/client";
import type {
  CreateMessMealPlanInput,
  MessMealPlanRepository,
  UpdateMessMealPlanInput,
} from "../domain/mess-meal-plan.repository";
import type { MessMealPlanEntity } from "../domain/mess-meal-plan.entity";

function toEntity(row: PrismaMessMealPlan): MessMealPlanEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    hostelId: row.hostelId,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaMessMealPlanRepository implements MessMealPlanRepository {
  async findById(tenantId: string, id: string): Promise<MessMealPlanEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.messMealPlan.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByHostel(tenantId: string, hostelId: string): Promise<MessMealPlanEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.messMealPlan.findMany({
        where: { tenantId, hostelId, deletedAt: null },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async create(input: CreateMessMealPlanInput): Promise<MessMealPlanEntity> {
    const row = await withTenantContext(input.tenantId, (tx) =>
      tx.messMealPlan.create({
        data: {
          tenantId: input.tenantId,
          hostelId: input.hostelId,
          name: input.name,
          description: input.description ?? null,
          createdBy: input.createdBy ?? null,
          updatedBy: input.createdBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async update(tenantId: string, id: string, input: UpdateMessMealPlanInput): Promise<MessMealPlanEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.messMealPlan.update({
        where: { tenantId_id: { tenantId, id } },
        data: {
          name: input.name,
          description: input.description,
          isActive: input.isActive,
          updatedBy: input.updatedBy ?? null,
        },
      })
    );
    return toEntity(row);
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<MessMealPlanEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.messMealPlan.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
