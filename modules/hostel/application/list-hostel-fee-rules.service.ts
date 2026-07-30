import "server-only";
import { PrismaHostelFeeRuleRepository } from "../infrastructure/prisma-hostel-fee-rule.repository";
import { toHostelFeeRuleDTO } from "./create-hostel-fee-rule.service";
import type { HostelFeeRuleDTO } from "./dto/hostel-fee-rule.dto";

export async function listHostelFeeRules(
  context: { tenantId: string },
  academicSessionId: string
): Promise<HostelFeeRuleDTO[]> {
  const repository = new PrismaHostelFeeRuleRepository();
  const rules = await repository.findByAcademicSession(context.tenantId, academicSessionId);
  return rules.map(toHostelFeeRuleDTO);
}
