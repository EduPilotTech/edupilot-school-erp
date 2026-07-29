import "server-only";
import { PrismaFineRuleRepository } from "../infrastructure/prisma-fine-rule.repository";
import { toFineRuleDTO } from "./create-fine-rule.service";
import type { FineRuleDTO } from "./dto/fine-rule.dto";

export async function listFineRules(tenantId: string, academicSessionId: string): Promise<FineRuleDTO[]> {
  const repository = new PrismaFineRuleRepository();
  const rules = await repository.findByAcademicSession(tenantId, academicSessionId);
  return rules.map(toFineRuleDTO);
}
