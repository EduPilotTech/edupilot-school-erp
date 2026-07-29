import "server-only";
import { PrismaInstallmentPlanRepository } from "../infrastructure/prisma-installment-plan.repository";
import type { InstallmentPlanDTO } from "./dto/installment-plan.dto";

export async function listInstallmentPlans(
  tenantId: string,
  academicSessionId: string
): Promise<InstallmentPlanDTO[]> {
  const repository = new PrismaInstallmentPlanRepository();
  const plans = await repository.findByAcademicSession(tenantId, academicSessionId);

  return Promise.all(
    plans.map(async (plan) => {
      const items = await repository.findItemsByPlan(tenantId, plan.id);
      return {
        id: plan.id,
        academicSessionId: plan.academicSessionId,
        name: plan.name,
        isActive: plan.isActive,
        items: items.map((item) => ({
          id: item.id,
          installmentPlanId: item.installmentPlanId,
          installmentNumber: item.installmentNumber,
          percentageOfTotal: item.percentageOfTotal,
          dueDayOffset: item.dueDayOffset,
        })),
      };
    })
  );
}
