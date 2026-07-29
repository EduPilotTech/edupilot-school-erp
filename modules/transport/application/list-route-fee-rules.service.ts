import "server-only";
import { PrismaRouteFeeRuleRepository } from "../infrastructure/prisma-route-fee-rule.repository";
import { toRouteFeeRuleDTO } from "./create-route-fee-rule.service";
import type { RouteFeeRuleDTO } from "./dto/route-fee-rule.dto";

export async function listRouteFeeRules(
  context: { tenantId: string },
  academicSessionId: string
): Promise<RouteFeeRuleDTO[]> {
  const repository = new PrismaRouteFeeRuleRepository();
  const rules = await repository.findByAcademicSession(context.tenantId, academicSessionId);
  return rules.map(toRouteFeeRuleDTO);
}
