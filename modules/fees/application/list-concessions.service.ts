import "server-only";
import { PrismaFeeConcessionRepository } from "../infrastructure/prisma-fee-concession.repository";
import { toFeeConcessionDTO } from "./apply-concession.service";
import type { FeeConcessionDTO } from "./dto/fee-concession.dto";

export async function listConcessionsForStudent(
  tenantId: string,
  studentId: string,
  academicSessionId: string
): Promise<FeeConcessionDTO[]> {
  const repository = new PrismaFeeConcessionRepository();
  const concessions = await repository.findByStudent(tenantId, studentId, academicSessionId);
  return concessions.map(toFeeConcessionDTO);
}
