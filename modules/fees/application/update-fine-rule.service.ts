import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaFineRuleRepository } from "../infrastructure/prisma-fine-rule.repository";
import { FineRuleNotFoundError } from "../domain/errors";
import { updateFineRuleSchema, type FineRuleDTO } from "./dto/fine-rule.dto";
import { toFineRuleDTO } from "./create-fine-rule.service";

export interface UpdateFineRuleContext {
  tenantId: string;
  actingUserId: string;
}

export async function updateFineRule(
  fineRuleId: string,
  input: unknown,
  context: UpdateFineRuleContext
): Promise<FineRuleDTO> {
  const parsed = updateFineRuleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid fine rule data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaFineRuleRepository();
  const existing = await repository.findById(tenantId, fineRuleId);
  if (!existing || existing.deletedAt !== null) {
    throw new FineRuleNotFoundError();
  }

  const rule = await repository.update(tenantId, fineRuleId, {
    name: data.name,
    gracePeriodDays: data.gracePeriodDays,
    fineType: data.fineType,
    fineValue: data.fineValue,
    maxFineAmount: data.maxFineAmount,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toFineRuleDTO(rule);
}

export async function deleteFineRule(fineRuleId: string, context: UpdateFineRuleContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaFineRuleRepository();
  const existing = await repository.findById(tenantId, fineRuleId);
  if (!existing || existing.deletedAt !== null) {
    throw new FineRuleNotFoundError();
  }
  await repository.softDelete(tenantId, fineRuleId, actingUserId);
}
