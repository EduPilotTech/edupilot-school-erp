import "server-only";
import { ValidationError } from "@/lib/errors";
import { PrismaRouteFeeRuleRepository } from "../infrastructure/prisma-route-fee-rule.repository";
import { RouteFeeRuleNotFoundError } from "../domain/errors";
import { updateRouteFeeRuleSchema, type RouteFeeRuleDTO } from "./dto/route-fee-rule.dto";
import { toRouteFeeRuleDTO } from "./create-route-fee-rule.service";
import type { TransportContext } from "./create-vehicle.service";

export async function updateRouteFeeRule(
  ruleId: string,
  input: unknown,
  context: TransportContext
): Promise<RouteFeeRuleDTO> {
  const parsed = updateRouteFeeRuleSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid route fee rule data.");
  }
  const data = parsed.data;
  const { tenantId, actingUserId } = context;

  const repository = new PrismaRouteFeeRuleRepository();
  const existing = await repository.findById(tenantId, ruleId);
  if (!existing || existing.deletedAt !== null) {
    throw new RouteFeeRuleNotFoundError();
  }

  const rule = await repository.update(tenantId, ruleId, {
    amount: data.amount,
    frequency: data.frequency,
    isActive: data.isActive,
    updatedBy: actingUserId,
  });
  return toRouteFeeRuleDTO(rule);
}

export async function deleteRouteFeeRule(ruleId: string, context: TransportContext): Promise<void> {
  const { tenantId, actingUserId } = context;
  const repository = new PrismaRouteFeeRuleRepository();
  const existing = await repository.findById(tenantId, ruleId);
  if (!existing || existing.deletedAt !== null) {
    throw new RouteFeeRuleNotFoundError();
  }
  await repository.softDelete(tenantId, ruleId, actingUserId);
}
