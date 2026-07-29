import type { InstallmentPlanEntity, InstallmentPlanItemEntity } from "./installment-plan.entity";

export interface CreateInstallmentPlanInput {
  tenantId: string;
  academicSessionId: string;
  name: string;
  createdBy?: string | null;
}

export interface CreateInstallmentPlanItemInput {
  installmentNumber: number;
  percentageOfTotal: number;
  dueDayOffset: number;
}

export interface InstallmentPlanRepository {
  findById(tenantId: string, id: string): Promise<InstallmentPlanEntity | null>;
  findByAcademicSession(tenantId: string, academicSessionId: string): Promise<InstallmentPlanEntity[]>;
  findItemsByPlan(tenantId: string, installmentPlanId: string): Promise<InstallmentPlanItemEntity[]>;
  // Creates the plan and its items atomically — same "create-if-missing + full item replace"
  // transaction shape as set-grade-scale.service.ts / GradeBandRepository.replaceAll, since
  // items have no stable natural key of their own worth upserting individually.
  createWithItems(
    input: CreateInstallmentPlanInput,
    items: CreateInstallmentPlanItemInput[],
    createdBy: string | null
  ): Promise<{ plan: InstallmentPlanEntity; items: InstallmentPlanItemEntity[] }>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<InstallmentPlanEntity>;
}
