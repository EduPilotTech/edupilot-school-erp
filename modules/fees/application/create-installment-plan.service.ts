import "server-only";
import { ValidationError } from "@/lib/errors";
import { InvalidAcademicSessionError } from "@/modules/students/domain/errors";
import { PrismaAcademicSessionRepository } from "@/modules/academics/infrastructure/prisma-academic-session.repository";
import { PrismaInstallmentPlanRepository } from "../infrastructure/prisma-installment-plan.repository";
import { InvalidInstallmentPlanError } from "../domain/errors";
import { validateInstallmentPlanItems } from "./installment-plan-validation.helpers";
import { createInstallmentPlanSchema, type InstallmentPlanDTO } from "./dto/installment-plan.dto";

export interface CreateInstallmentPlanContext {
  tenantId: string;
  actingUserId: string;
}

export async function createInstallmentPlan(
  input: unknown,
  context: CreateInstallmentPlanContext
): Promise<InstallmentPlanDTO> {
  const parsed = createInstallmentPlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid installment plan data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const sessionRepository = new PrismaAcademicSessionRepository();
  const session = await sessionRepository.findById(tenantId, data.academicSessionId);
  if (!session || session.deletedAt !== null) {
    throw new InvalidAcademicSessionError();
  }

  const validationError = validateInstallmentPlanItems(data.items);
  if (validationError) {
    throw new InvalidInstallmentPlanError(validationError);
  }

  const repository = new PrismaInstallmentPlanRepository();
  const { plan, items } = await repository.createWithItems(
    { tenantId, academicSessionId: data.academicSessionId, name: data.name, createdBy: actingUserId },
    data.items,
    actingUserId
  );

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
}
