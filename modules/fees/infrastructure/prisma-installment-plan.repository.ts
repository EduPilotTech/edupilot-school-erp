import "server-only";
import { withTenantContext } from "@/lib/prisma/tenant-context";
import type {
  InstallmentPlan as PrismaInstallmentPlan,
  InstallmentPlanItem as PrismaInstallmentPlanItem,
} from "@/lib/generated/prisma/client";
import type {
  CreateInstallmentPlanInput,
  CreateInstallmentPlanItemInput,
  InstallmentPlanRepository,
} from "../domain/installment-plan.repository";
import type { InstallmentPlanEntity, InstallmentPlanItemEntity } from "../domain/installment-plan.entity";

function toEntity(row: PrismaInstallmentPlan): InstallmentPlanEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    academicSessionId: row.academicSessionId,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

function toItemEntity(row: PrismaInstallmentPlanItem): InstallmentPlanItemEntity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    installmentPlanId: row.installmentPlanId,
    installmentNumber: row.installmentNumber,
    percentageOfTotal: row.percentageOfTotal.toNumber(),
    dueDayOffset: row.dueDayOffset,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export class PrismaInstallmentPlanRepository implements InstallmentPlanRepository {
  async findById(tenantId: string, id: string): Promise<InstallmentPlanEntity | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.installmentPlan.findUnique({ where: { tenantId_id: { tenantId, id } } })
    );
    return row ? toEntity(row) : null;
  }

  async findByAcademicSession(tenantId: string, academicSessionId: string): Promise<InstallmentPlanEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.installmentPlan.findMany({
        where: { tenantId, academicSessionId, deletedAt: null },
        orderBy: { name: "asc" },
      })
    );
    return rows.map(toEntity);
  }

  async findItemsByPlan(tenantId: string, installmentPlanId: string): Promise<InstallmentPlanItemEntity[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.installmentPlanItem.findMany({
        where: { tenantId, installmentPlanId, deletedAt: null },
        orderBy: { installmentNumber: "asc" },
      })
    );
    return rows.map(toItemEntity);
  }

  async createWithItems(
    input: CreateInstallmentPlanInput,
    items: CreateInstallmentPlanItemInput[],
    createdBy: string | null
  ): Promise<{ plan: InstallmentPlanEntity; items: InstallmentPlanItemEntity[] }> {
    const result = await withTenantContext(input.tenantId, async (tx) => {
      const plan = await tx.installmentPlan.create({
        data: {
          tenantId: input.tenantId,
          academicSessionId: input.academicSessionId,
          name: input.name,
          createdBy: input.createdBy ?? null,
        },
      });

      const createdItems = await Promise.all(
        items.map((item) =>
          tx.installmentPlanItem.create({
            data: {
              tenantId: input.tenantId,
              installmentPlanId: plan.id,
              installmentNumber: item.installmentNumber,
              percentageOfTotal: item.percentageOfTotal,
              dueDayOffset: item.dueDayOffset,
              createdBy,
            },
          })
        )
      );

      return { plan, items: createdItems };
    });

    return { plan: toEntity(result.plan), items: result.items.map(toItemEntity) };
  }

  async softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<InstallmentPlanEntity> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.installmentPlan.update({
        where: { tenantId_id: { tenantId, id } },
        data: { deletedAt: new Date(), isActive: false, updatedBy: deletedBy },
      })
    );
    return toEntity(row);
  }
}
