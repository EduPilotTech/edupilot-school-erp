import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaHostelFeeRuleRepository } from "../infrastructure/prisma-hostel-fee-rule.repository";
import { HostelFeeRuleNotFoundError } from "../domain/errors";
import { updateHostelFeeRuleSchema, type HostelFeeRuleDTO } from "./dto/hostel-fee-rule.dto";
import { toHostelFeeRuleDTO } from "./create-hostel-fee-rule.service";
import type { HostelContext } from "./create-hostel.service";

export async function updateHostelFeeRule(
  ruleId: string,
  input: unknown,
  context: HostelContext
): Promise<HostelFeeRuleDTO> {
  const parsed = updateHostelFeeRuleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid hostel fee rule data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaHostelFeeRuleRepository();
  const existing = await repository.findById(tenantId, ruleId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelFeeRuleNotFoundError();
  }

  const rule = await repository.update(tenantId, ruleId, {
    amount: data.amount,
    frequency: data.frequency,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toHostelFeeRuleDTO(rule);
}

export async function deleteHostelFeeRule(ruleId: string, context: HostelContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaHostelFeeRuleRepository();
  const existing = await repository.findById(tenantId, ruleId);
  if (!existing || existing.deletedAt !== null) {
    throw new HostelFeeRuleNotFoundError();
  }
  await repository.softDelete(tenantId, ruleId, actingUserId);
}
